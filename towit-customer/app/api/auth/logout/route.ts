import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function GET() {
  const { session } = await auth()
  
  if (session) {
    await auth().signOut(() => redirect("/"))
  }
  
  redirect("/")
}
