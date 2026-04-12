import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function StockOutPage() {
  const { stockItems, setStockItems, stockMovements, setStockMovements } = useData();
  const [selectedItem, setSelectedItem] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [takenBy, setTakenBy] = useState("");

  const filteredItems = stockItems.filter(i =>
    !searchItem || i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const handleRemove = () => {
    if (!selectedItem || !quantity || !takenBy) { toast.error("Fill all fields"); return; }
    const qty = parseInt(quantity);
    const item = stockItems.find(i => i.id === selectedItem);
    if (!item || item.quantity < qty) { toast.error("Not enough stock"); return; }

    setStockItems(prev => prev.map(i => i.id === selectedItem ? { ...i, quantity: i.quantity - qty } : i));
    setStockMovements(prev => [...prev, {
      id: `SM${String(prev.length + 1).padStart(3, "0")}`,
      itemId: selectedItem, itemName: item.name,
      type: "out", quantity: qty, takenBy,
      date: new Date().toISOString().split("T")[0],
    }]);
    setSelectedItem(""); setQuantity(""); setTakenBy(""); setSearchItem("");
    toast.success("Stock removed");
  };

  const recentOut = stockMovements.filter(m => m.type === "out").slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Stock Out</h1>
        <p className="text-muted-foreground mt-1">Record outgoing stock</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground">Remove Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-foreground">Search Item</Label>
            <Input value={searchItem} onChange={e => setSearchItem(e.target.value)} placeholder="Search by name" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-foreground">Select Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Choose item" /></SelectTrigger>
              <SelectContent>{filteredItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground">Quantity</Label><Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Taken By</Label><Input value={takenBy} onChange={e => setTakenBy(e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-foreground">Date</Label><Input value={new Date().toISOString().split("T")[0]} disabled className="bg-muted border-border" /></div>
        </div>
        <Button onClick={handleRemove} variant="destructive"><Minus className="w-4 h-4 mr-2" /> Remove Stock</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Recent 5 Stock Out</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Qty</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Taken By</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {recentOut.map(m => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{m.itemName}</td>
                  <td className="p-4 text-muted-foreground">{m.quantity}</td>
                  <td className="p-4 text-card-foreground">{m.takenBy}</td>
                  <td className="p-4 text-muted-foreground">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
