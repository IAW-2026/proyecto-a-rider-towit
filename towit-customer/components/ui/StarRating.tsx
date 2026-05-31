import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar } from "@fortawesome/free-solid-svg-icons"

export function StarRatingDisplay({
  rating,
  size = "text-lg",
}: {
  rating: number
  size?: string
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FontAwesomeIcon
          key={s}
          icon={faStar}
          className={`${size} ${s <= rating ? "text-brand-yellow" : "text-gray-300"}`}
        />
      ))}
    </div>
  )
}


