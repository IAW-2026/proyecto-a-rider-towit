import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function GET() {
  const { userId } = await auth()
  
  if (userId) {
    await auth().signOut(() => redirect("/"))
  }
  
  redirect("/")
}
