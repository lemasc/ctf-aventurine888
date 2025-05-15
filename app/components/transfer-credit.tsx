import { useState } from "react";
import { useRevalidator } from "react-router";
import {
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
  Card,
} from "./ui/card";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { rpc } from "~/lib/rpc";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./ui/input-otp";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Input } from "./ui/input";
import type { Info } from "../routes/+types/app._index";

export function TransferCreditCard({
  user,
}: {
  user: Info["loaderData"]["user"];
}) {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { revalidate } = useRevalidator();

  const sendNotification = async (receiverId: string, content: string) => {
    console.log(`To: ${receiverId}`, `Content: ${content}`);
    await rpc.api.notifications.notify.$post({
      json: {
        receiverId,
        content,
      },
    });
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      console.log("Sending transfer request...");
      const payload = {
        recipientId,
        amount: parseInt(amount, 10),
        pin,
      } as const;
      console.log(payload);
      const response = await rpc.api.transfer.credit.$post({
        json: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Transfer failed");
      }

      setSuccess("Transfer successful!");
      console.log("Transfer successful!");

      // setRecipientId("");
      setAmount("");
      setPin("");

      console.log("Sending notifications...");

      // Send notifications
      await Promise.all([
        // Notify sender
        sendNotification(
          user.userId,
          `You sent ${amount.toLocaleString()} credits to UID ${recipientId}`
        ),
        // Notify recipient
        sendNotification(
          recipientId,
          `You received ${amount.toLocaleString()} credits from UID ${
            user.userId
          }`
        ),
      ]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsLoading(false);
      revalidate();
    }
  };

  return (
    <Card className="bg-blue-50/70 backdrop-blur-sm gap-3">
      <CardHeader>
        <CardTitle>Transfer Credits</CardTitle>
        <CardDescription>Send credits to another user</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">Recipient ID</Label>
            <p className="text-xs text-zinc-600">
              You can type or paste the recipient ID here.
            </p>
            <InputOTP
              id="recipientId"
              maxLength={10}
              value={recipientId}
              onChange={(v) => setRecipientId(v.toUpperCase())}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              pasteTransformer={(pasted) => pasted.replaceAll("-", "")}
              containerClassName="gap-1 text-sm"
              required
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-white w-9 h-9" />
                <InputOTPSlot index={1} className="bg-white w-9 h-9" />
                <InputOTPSlot index={2} className="bg-white w-9 h-9" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="bg-white w-9 h-9" />
                <InputOTPSlot index={4} className="bg-white w-9 h-9" />
                <InputOTPSlot index={5} className="bg-white w-9 h-9" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={7} className="bg-white w-9 h-9" />
                <InputOTPSlot index={8} className="bg-white w-9 h-9" />
                <InputOTPSlot index={9} className="bg-white w-9 h-9" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">Transfer PIN</Label>
            <InputOTP
              id="transferPin"
              maxLength={6}
              value={pin}
              onChange={setPin}
              pattern={REGEXP_ONLY_DIGITS}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-white w-16" />
                <InputOTPSlot index={1} className="bg-white w-16" />
                <InputOTPSlot index={2} className="bg-white w-16" />
                <InputOTPSlot index={3} className="bg-white w-16" />
                <InputOTPSlot index={4} className="bg-white w-16" />
                <InputOTPSlot index={5} className="bg-white w-16" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <div className="text-red-700 text-sm">{error}</div>}
          {success && <div className="text-green-700 text-sm">{success}</div>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size={"lg"}
          >
            {isLoading ? "Processing..." : "Transfer Credits"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
