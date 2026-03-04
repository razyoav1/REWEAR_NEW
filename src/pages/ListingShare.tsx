import { useParams } from "react-router-dom";
import ListingDetail from "./ListingDetail";

// Same view as ListingDetail, accessible via shareable /l/:id URL
export default function ListingShare() {
  return <ListingDetail />;
}
