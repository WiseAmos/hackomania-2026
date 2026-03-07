import ClaimsClientPage from "./claimsPage"


export default function claimsPage() {

  const currentDisasters = ["ukraine war", "paskistan war", "Turkey flooding"]

  return (
    <ClaimsClientPage currentDisasters={currentDisasters} />
  )
}