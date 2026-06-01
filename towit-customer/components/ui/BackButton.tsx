import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"

export default function BackButton({ href = "/costumer/home" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors duration-200 hover:bg-muted"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
    </Link>
  )
}
