import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedSubstitutionMocks } from "./data/seedSubstitutionMocks";

// Seed mock substitution composites + groups for the cashier POS demo flow.
seedSubstitutionMocks();

createRoot(document.getElementById("root")!).render(<App />);
