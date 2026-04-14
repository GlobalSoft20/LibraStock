import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function StockItemsPage() {
  const { stockItems, setStockItems } = useData();
  const [name, setName] = useState("");
  const [lowQty, setLowQty] = useState("");

  const handleAdd = async () => {
    if (!name || !lowQty) { toast.error("Fill all fields"); return; }
    const { data, error } = await supabase.from("stock_items").insert({
      name,
      quantity: 0,
      low_stock_qty: parseInt(lowQty),
      added_date: new Date().toISOString().split("T")[0],
    }).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setStockItems(prev => [...prev, {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        lowStockQty: data.low_stock_qty,
        addedDate: data.added_date,
      }] );
    }

    setName(""); setLowQty("");
    toast.success("Item added");
  };

  const recent = [...stockItems].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Stock Items</h1>
        <p className="text-muted-foreground mt-1">Add and manage stock items</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground">Add Item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-foreground">Item Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Low Stock Quantity</Label><Input type="number" value={lowQty} onChange={e => setLowQty(e.target.value)} className="bg-secondary border-border" /></div>
          <div className="flex items-end"><Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Item</Button></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Recent 5 Added Items</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Quantity</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Low Stock Threshold</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Added Date</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {recent.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{item.name}</td>
                  <td className="p-4 text-muted-foreground">{item.quantity}</td>
                  <td className="p-4 text-muted-foreground">{item.lowStockQty}</td>
                  <td className="p-4 text-muted-foreground">{item.addedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
