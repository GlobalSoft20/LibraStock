import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["Science", "Fiction", "History", "Mathematics", "Technology", "Literature", "Arts", "Business"];

export default function BooksPage() {
  const { books, setBooks } = useData();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [bookName, setBookName] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [totalCopy, setTotalCopy] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = books.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddBook = async () => {
    if (!bookName || !author || !category || !totalCopy) {
      toast.error("Please fill all fields");
      return;
    }
    const copies = parseInt(totalCopy);
    const { data, error } = await supabase.from("books").insert({
      name: bookName,
      author,
      category,
      total_copy: copies,
      available_copy: copies,
      cover_url: coverPreview,
    }).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setBooks(prev => [...prev, {
        id: data.id,
        name: data.name,
        author: data.author,
        category: data.category,
        totalCopy: data.total_copy,
        availableCopy: data.available_copy,
        coverUrl: data.cover_url ?? undefined,
      }] );
    }

    setBookName(""); setAuthor(""); setCategory(""); setTotalCopy(""); setCoverPreview(undefined);
    setOpen(false);
    toast.success("Book added successfully");
  };

  const handleDeleteBook = async (bookId: string) => {
    const { error } = await supabase.from("books").delete().eq("id", bookId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBooks(prev => prev.filter((book) => book.id !== bookId));
    toast.success("Book deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Books</h1>
          <p className="text-muted-foreground mt-1">Manage library book collection</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90"><Plus className="w-4 h-4 mr-2" /> Add Book</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Add New Book</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-foreground">Book Name</Label><Input value={bookName} onChange={e => setBookName(e.target.value)} className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Author</Label><Input value={author} onChange={e => setAuthor(e.target.value)} className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-foreground">Total Copies</Label><Input type="number" value={totalCopy} onChange={e => setTotalCopy(e.target.value)} className="bg-secondary border-border" /></div>
              <div>
                <Label className="text-foreground">Upload Cover Page</Label>
                <input type="file" ref={fileRef} accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full border-border text-foreground"><Upload className="w-4 h-4 mr-2" /> Choose File</Button>
                {coverPreview && <img src={coverPreview} alt="Cover" className="mt-2 h-20 rounded-lg object-cover" />}
              </div>
              <Button onClick={handleAddBook} className="w-full gradient-primary text-primary-foreground">Add Book</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((book, i) => (
          <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl shadow-card border border-border overflow-hidden hover:shadow-card-hover transition-shadow">
            <div className="h-32 gradient-primary flex items-center justify-center overflow-hidden">
              {book.coverUrl ? <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover" /> : <BookOpen className="w-12 h-12 text-primary-foreground/40" />}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-card-foreground">{book.name}</h3>
                  <p className="text-sm text-muted-foreground">by {book.author}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBook(book.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">{book.category}</span>
                <span className="text-muted-foreground">{book.availableCopy}/{book.totalCopy} available</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
