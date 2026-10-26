import { ProtoHome } from "@/components/proto-home";
import { getMockUser } from "@/lib/mock-data";

export const metadata = {
  title: "Home · prototipo Lovi",
};

export default function ProtoHomePage() {
  const viewer = getMockUser("user-abril");
  const firstName = viewer?.nombre.split(" ")[0] ?? "hola";

  return <ProtoHome viewerName={firstName} />;
}
