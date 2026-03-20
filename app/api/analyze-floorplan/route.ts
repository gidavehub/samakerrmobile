import { NextResponse } from 'next/server';
import { VertexAI, SchemaType } from '@google-cloud/vertexai';

// Initialize Vertex AI using the Service Account JSON
const initVertexAI = () => {
  try {
    const credsStr = process.env.GCP_SERVICE_ACCOUNT_JSON;
    if (!credsStr) throw new Error("Missing GCP_SERVICE_ACCOUNT_JSON in environment variables");
    
    const credentials = JSON.parse(credsStr);
    
    // Fix private key formatting if it got mangled by env string passing
    const formattedPrivateKey = credentials.private_key.replace(/\\n/g, '\n');

    return new VertexAI({
        project: credentials.project_id,
        location: 'us-central1', // Vertex Generative AI endpoints do not exist in 'global'
        googleAuthOptions: {
            credentials: {
                client_email: credentials.client_email,
                private_key: formattedPrivateKey,
            }
        }
    });
  } catch (error) {
    console.error("Failed to initialize Vertex AI client:", error);
    throw new Error(`Vertex AI Auth Error: ${(error as Error).message}`);
  }
};

// The structure we want Gemini to return
const roomSchema = {
  type: SchemaType.ARRAY,
  description: "A list of rooms detected in the floorplan image.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.STRING,
        description: "A unique identifier for the room, like 'room_1', 'living_room_1'. No spaces."
      },
      name: {
        type: SchemaType.STRING,
        description: "A human-readable label for the room. Examples: 'Kitchen', 'Master Bedroom', 'Hallway', 'Bathroom', 'Balcony'."
      },
      // Coordinates normalized to 0-100 percentage.
      // E.g., x: 10 means 10% from the left edge of the image.
      boundingBox: {
        type: SchemaType.OBJECT,
        description: "The bounding box coordinates of the room, as percentages (0 to 100) of the image's width and height.",
        properties: {
          x: { type: SchemaType.NUMBER, description: "X coordinate of the top-left corner (0-100 percentage)." },
          y: { type: SchemaType.NUMBER, description: "Y coordinate of the top-left corner (0-100 percentage)." },
          width: { type: SchemaType.NUMBER, description: "Width of the room (0-100 percentage)." },
          height: { type: SchemaType.NUMBER, description: "Height of the room (0-100 percentage)." },
        },
        required: ["x", "y", "width", "height"]
      }
    },
    required: ["id", "name", "boundingBox"]
  }
};

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided to the API' }, { status: 400 });
    }

    let vertexAI;
    try {
        vertexAI = initVertexAI();
    } catch (authErr: any) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
    }
    
    // Force the exact 3.0 Flash preview version string on Vertex
    const generativeModel = vertexAI.getGenerativeModel({
        model: 'gemini-3-flash-preview', 
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: roomSchema,
        }
    });

    // Ensure clean base64 (remove data:image/jpeg;base64, if present)
    let cleanBase64 = imageBase64;
    if (imageBase64.includes('base64,')) {
        cleanBase64 = imageBase64.split('base64,')[1];
    }

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              }
            },
            {
                text: "Analyze this architectural floorplan or blueprint with EXTREME precision. We need perfect cutouts of the layout. Identify EVERY SINGLE space, no matter how small: every bedroom, bathroom, kitchen, living area, hallway, closet, balcony, patio, and utility room. For each space, provide a descriptive name (e.g., 'Master Bedroom', 'Guest Bathroom', 'Entry Hallway', 'Walk-in Closet'). Draw a bounding box that PERFECTLY hugs the interior walls of that exact space without bleeding over. The bounding boxes MUST NOT OVERLAP under any circumstances. Every single usable area of the floorplan must be accounted for. The bounding box coordinates MUST be exact percentages (0 to 100, allowing decimals for high precision) relative to the top-left corner of the image. x is horizontal distance from left, y is vertical distance from top. Width and height are the dimensions. BE SUPER PRECISE."
            }
          ]
        }
      ]
    };

    try {
        const responseStream = await generativeModel.generateContent(request);
        const response = await responseStream.response;
        
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
            return NextResponse.json({ error: "Vertex AI returned an empty response" }, { status: 502 });
        }

        let parsedRooms;
        try {
            parsedRooms = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Vertex AI JSON output:", text);
            return NextResponse.json({ error: "Vertex AI returned invalid JSON", details: text }, { status: 502 });
        }

        return NextResponse.json({ rooms: parsedRooms });
        
    } catch (apiError: any) {
        // Safe stringification for Next.js console
        let errMessage = apiError.message || String(apiError);
        console.error("RAW VERTEX API ERROR:", errMessage);
        throw new Error(`Vertex API Error: ${errMessage}`);
    }

  } catch (error: any) {
    console.error('Critical Error analyzing floorplan via Vertex AI:', error);
    return NextResponse.json({ 
        error: "Failed to communicate with Vertex AI", 
        details: error.message || String(error)
    }, { status: 500 });
  }
}

