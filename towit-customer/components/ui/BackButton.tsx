import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"

export default function BackButton({ href = "/costumer/home" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition-colors duration-200 hover:bg-gray-100"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
    </Link>
  )
}
