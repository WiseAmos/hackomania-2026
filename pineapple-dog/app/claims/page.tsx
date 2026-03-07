import ClaimsClientPage from "./ClaimsPage"


export default function claimsPage() {

  const currentDisasters = ["ukraine war", "paskistan war", "Turkey flooding"]

  return (
    <ClaimsClientPage currentDisasters={currentDisasters} />
  )
}