import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

  cloudinary.config({ 
        cloud_name:process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: 'process.env.CLOUDINARY_API_SECRET '// Click 'View API Keys' above to copy your API secret
    });

interface CloudinaryUploadResult {
    public_id:string;
    bytes:number;
    duration?:number
    [key: string] :any
}

export async function POST(request: NextRequest) {
    const {userId} = await auth();

    if(!userId) {
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }

    
    try {

         if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
         process.env.ClOUDINARY_API_SECRET
     ){
        return NextResponse.json({error:"cloudinary credentials not found"},{status:500})
     }


        const formData = await request.formData(); 
        const file = formData.get("file") as File | null;
        const title= formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if(!file){
            return NextResponse.json({eror:"File not found"}, {status:400})
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

         const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
              const uploadStream =  cloudinary.uploader.upload_stream(
                    {   resources_type:"video",
                        folder:"video-uploads",
                        transformation: [
                            {quality: "auto", feetch_format:"mp4"},
                        ]
                    },
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer);
            }
        )
      const video = await prisma.video.create({
          data : {
                title,
                description,
                originalSize:originalSize,
                publicId: result.public_id,
                compressesSize:String( result.bytes),
                duration: result.duration || 0,

          }
      })

    }catch(error) {
       console.log("UPload image failed", error)
       return NextResponse.json({error:"Upload video failed"},{status:500})
    }finally [
        await prisma .$disconnect()
    ]
}