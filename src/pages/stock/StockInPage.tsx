import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function StockInPage() {
  const { user } = useAuth();
  const { stockItems, setStockItems, stockMovements, setStockMovements } = useData();
  const [selectedItem, setSelectedItem] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState("");

  const filteredItems = stockItems.filter(i =>
    !searchItem || i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedItem || !quantity || !supplier) { toast.error("Fill all required fields"); return; }
    const qty = parseInt(quantity);
    const item = stockItems.find(i => i.id === selectedItem);
    if (!item) { toast.error("Selected item not found"); return; }

    const { error: stockError } = await supabase.from("stock_items").update({ quantity: item.quantity + qty }).eq("id", selectedItem);
    if (stockError) {
      toast.error(stockError.message);
      return;
    }

    const { data, error: movementError } = await supabase.from("stock_movements").insert({
      item_id: selectedItem,
      item_name: item.name,
      type: "in",
      quantity: qty,
      supplier_name: supplier,
      price_per_unit: price ? parseFloat(price) : null,
      date: new Date().toISOString().split("T")[0],
      added_by: user?.fullName,
    }).select().single();

    if (movementError) {
      toast.error(movementError.message);
      return;
    }

    setStockItems(prev => prev.map(i => i.id === selectedItem ? { ...i, quantity: i.quantity + qty } : i));
    if (data) {
      setStockMovements(prev => [...prev, {
        id: data.id,
        itemId: data.item_id,
        itemName: data.item_name,
        type: data.type,
        quantity: data.quantity,
        supplierName: data.supplier_name ?? undefined,
        takenBy: data.taken_by ?? undefined,
        pricePerUnit: data.price_per_unit ?? undefined,
        date: data.date,
        addedBy: data.added_by ?? undefined,
      }] );
    }

    setSelectedItem(""); setQuantity(""); setSupplier(""); setPrice(""); setSearchItem("");
    toast.success("Stock added");
  };

  const recentIn = stockMovements.filter(m => m.type === "in").slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Stock In</h1>
        <p className="text-muted-foreground mt-1">Record incoming stock</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground">Add Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-foreground">Search Item</Label>
            <Input value={searchItem} onChange={e => setSearchItem(e.target.value)} placeholder="Search by name" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-foreground">Select Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Choose item" /></SelectTrigger>
              <SelectContent>{filteredItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground">Quantity</Label><Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Supplier Name</Label><Input value={supplier} onChange={e => setSupplier(e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-foreground">Price Per Unit</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Date</Label><Input value={new Date().toISOString().split("T")[0]} disabled className="bg-muted border-border" /></div>
        </div>
        <Button onClick={handleAdd} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Stock</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Recent 5 Stock In</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Qty</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Supplier</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Price/Unit</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {recentIn.map(m => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{m.itemName}</td>
                  <td className="p-4 text-muted-foreground">{m.quantity}</td>
                  <td className="p-4 text-card-foreground">{m.supplierName}</td>
                  <td className="p-4 text-muted-foreground">{m.pricePerUnit || "-"}</td>
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
