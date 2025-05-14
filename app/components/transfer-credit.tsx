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

export function TransferCreditCard() {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { revalidate } = useRevalidator();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await rpc.api.transfer.credit.$post({
        json: {
          recipientId,
          amount: parseInt(amount, 10),
          pin,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Transfer failed");
      }

      setSuccess("Transfer successful!");

      // setRecipientId("");
      setAmount("");
      setPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsLoading(false);
      revalidate();
    }
  };

  return (
    <Card className="bg-blue-50/90 gap-3">
      <CardHeader>
        <CardTitle>Transfer Credits</CardTitle>
        <CardDescription>Send credits to another user</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">Recipient ID</Label>
            <InputOTP
              maxLength={10}
              value={recipientId}
              onChange={(v) => setRecipientId(v.toUpperCase())}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
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
