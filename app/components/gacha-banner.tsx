import anaxa from "~/medias/anaxa.webp";
import { Button } from "./ui/button";
import { rpc } from "~/lib/rpc";

export function GachaBanner() {
  const pullGacha = async () => {
    try {
      const response = await rpc.api.user.pull.$post();
      if (response.status === 200) {
        const { message, flag } = await response.json();
        console.log(flag);
        alert(message);
      } else {
        const { message } = await response.json();
        alert(message);
      }
    } catch (error) {
      console.error("Error pulling gacha:", error);
      alert("An error occurred while pulling gacha.");
    }
  };
  return (
    <div className="rounded-tr-xl gap-3 w-full overflow-hidden py-0 border border-green-800 relative">
      <img
        draggable={false}
        src={anaxa}
        alt="Anaxa"
        className="w-full h-auto"
      />
      <div className="absolute right-0 bottom-0 p-8 flex flex-col items-end gap-2">
        <Button onClick={pullGacha} size="lg" className="font-bold">
          Pull Now!
        </Button>
        <div className="bg-white/50 backdrop-blur-sm text-black px-4 py-2 text-sm">
          Requires <b>6,400 Credits</b>
        </div>
      </div>
    </div>
  );
}
