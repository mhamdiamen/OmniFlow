import { Info } from "lucide-react";

export function RulesAlert({ rules }: { rules: string[] }) {
  // Split rules into chunks of 3
  const chunkedRules = [];
  for (let i = 0; i < rules.length; i += 3) {
    chunkedRules.push(rules.slice(i, i + 3));
  }

  return (
    <div className="space-y-2 mt-4">
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Rules</h3>
      {chunkedRules.map((ruleGroup, groupIndex) => (
       <div key={groupIndex} className="flex gap-4 flex-col md:flex-row items-center">
       {ruleGroup.map((rule, index) => (
         <div
           key={index}
           className="flex-1 rounded-lg border border-border px-4 py-3 w-full md:w-auto"
         >
           <p className="text-base font-semibold text-center md:text-left">
             <Info
               className="-mt-0.5 me-3 inline-flex"
               size={16}
               strokeWidth={2}
               aria-hidden="true"
             />
             {rule}
           </p>
         </div>
       ))}
     </div>
      ))}
    </div>
  );
}