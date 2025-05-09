import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/",
    "/home"
])
const isPublicApiRoute = createRouteMatcher([
    "/api/videos"
])

export default clerkMiddleware(async (auth, req) => {
     // Check if the user is authenticated
    const {userId} = await auth();
      // Get the current URL
    const currentUrl = new URL(req.url)
    // Check if the user is trying to access the dashboard
   const isAccessingDashnoard= currentUrl.pathname === "/home"
    // Check if the request is an API request
   const isAPiRequest = currentUrl.pathname.startsWith("/api")
   // if it is logedin
   if(userId && isPublicRoute(req) && !isAccessingDashnoard){
    return NextResponse.redirect(new URL("/home",req.url))
   }

   //not logged in
   if(!userId){
    //if user is not logged in and trying to access a protected route
     if(!isPublicRoute(req) && !isPublicApiRoute(req)){
        return NextResponse.redirect(new URL("/sign-in",req.url))
     }

     // if the request is for a protected API and the user is not logged in
     if(isAPiRequest && !isPublicApiRoute(req)){
        return NextResponse.redirect(new URL("/sign-in",req.url))
     }
   }
   return NextResponse.next();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}