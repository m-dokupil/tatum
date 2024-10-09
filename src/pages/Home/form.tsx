import { useState, useEffect } from "react";
import { Network, TatumSDK, Ethereum } from "@tatumio/tatum";

const REQUEST_LIMITER = 30 // Number of seconds to wait between 2 consecutive requests

interface FormState {
  error: string;
  inputValue: string;
  labelText: string;
  balance: string | null;
}

const Form: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    error: "",
    inputValue: "",
    labelText: "",
    balance: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    let countdown: ReturnType<typeof setInterval> | null = null;

    if (isBlocked && timer !== null) {
      countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev && prev > 0) {
            return prev - 1;
          } else {
            setIsBlocked(false);
            setRequestCount(0);
            return null;
          }
        });
      }, 1000);
    }

    return () => {
      if (countdown) clearInterval(countdown);
    };
  }, [isBlocked, timer]);

  const handleButtonClick = async () => {
    if (isBlocked) return;

    setFormState((prev) => ({ ...prev, error: "", labelText: "" }));

    if (!formState.inputValue) {
      setFormState((prev) => ({ ...prev, error: "Please enter an address" }));
      return;
    }

    if (!isValidEthereumAddress(formState.inputValue)) {
      setFormState((prev) => ({ ...prev, error: "Invalid Ethereum address" }));
      return;
    }

    try {
      setIsLoading(true);

      const tatum = await TatumSDK.init<Ethereum>({
        network: Network.ETHEREUM,
        apiKey: { v4: "t-65ddbb2bb792d6001be685d9-442dd087e58442acac87f5f9" },
        verbose: true,
      });

      const { data } = await tatum.address.getBalance({
        addresses: [formState.inputValue],
      });

      if (data.length === 0) {
        setFormState((prev) => ({ ...prev, error: "No balance found for this address." }));
      }

      const balanceData = data.find((asset) => asset.asset === "ETH");

      if (balanceData) {
        setFormState((prev) => ({ ...prev, balance: balanceData.balance, labelText: `Balance: ${balanceData.balance} ETH` }));
      } else {
        setFormState((prev) => ({ ...prev, labelText: "No ETH balance found for this address." }));
      }

      setRequestCount((prev) => prev + 1);

      if (requestCount >= 1) {
        setIsBlocked(true);
        setTimer(REQUEST_LIMITER); 
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setFormState((prev) => ({ ...prev, error: "Failed to fetch balance. Please try again later." }));
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEthereumAddress = (address: string): boolean => {
    const regex = /^0x[a-fA-F0-9]{40}$/;
    return regex.test(address);
  };

  const buttonText = isBlocked ? `Wait ${timer}s` : (isLoading ? "Loading..." : "Check Balance");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <input
        type="text"
        value={formState.inputValue}
        onChange={(e) => setFormState((prev) => ({ ...prev, inputValue: (e.target as HTMLInputElement).value }))}
        placeholder="Enter ETH wallet address to get balance"
        style={{ padding: "5px", width: "320px" }}
      />

      {formState.error && <p style={{ color: "red", margin: "15px auto 0 auto"}}>{formState.error}</p>}

      <button onClick={handleButtonClick} style={{ padding: "10px 30px", margin: "15px auto" }} disabled={isBlocked || isLoading}>
        {buttonText}
      </button>
      
      <p style={{ padding: "5px", fontSize: "16px", fontWeight: "bold" }}>
        {formState.labelText}
      </p>
    </div>
  );
}

export default Form;
