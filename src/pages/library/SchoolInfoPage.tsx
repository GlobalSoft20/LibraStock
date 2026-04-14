import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Building2, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function SchoolInfoPage() {
  const { departments, setDepartments, levels, setLevels, classes, setClasses } = useData();
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [levelDialogOpen, setLevelDialogOpen] = useState<string | null>(null);
  const [classDialogOpen, setClassDialogOpen] = useState<{ deptId: string; levelId: string } | null>(null);
  const [levelName, setLevelName] = useState("");
  const [className, setClassName] = useState("");

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleLevel = (key: string) => {
    setExpandedLevels(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const addDepartment = async () => {
    if (!deptName.trim()) return;
    const { data, error } = await supabase.from("departments").insert({
      name: deptName.trim(),
      description: deptDescription.trim(),
    }).select().single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setDepartments(d => [...d, { id: data.id, name: data.name, description: data.description ?? "" }]);
    }
    setDeptName("");
    setDeptDescription("");
    setDeptDialogOpen(false);
    toast.success("Department added");
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDepartments(d => d.filter(x => x.id !== id));
    setClasses(c => c.filter(x => x.departmentId !== id));
    toast.success("Department deleted");
  };

  const addLevel = async () => {
    if (!levelName.trim()) return;
    const { data, error } = await supabase.from("levels").insert({ name: levelName.trim() }).select().single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setLevels(l => [...l, { id: data.id, name: data.name }]);
    }
    setLevelDialogOpen(null);
    setLevelName("");
    toast.success("Level added");
  };

  const deleteLevel = async (levelId: string) => {
    const { error } = await supabase.from("levels").delete().eq("id", levelId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLevels(l => l.filter(x => x.id !== levelId));
    setClasses(c => c.filter(x => x.levelId !== levelId));
    toast.success("Level deleted");
  };

  const addClass = async (deptId: string, levelId: string) => {
    if (!className.trim()) return;
    const { data, error } = await supabase.from("school_classes").insert({
      name: className.trim(),
      department_id: deptId,
      level_id: levelId,
    }).select().single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setClasses(c => [...c, { id: data.id, name: data.name, departmentId: data.department_id, levelId: data.level_id }]);
    }
    setClassName("");
    setClassDialogOpen(null);
    toast.success("Class added");
  };

  const deleteClass = async (classId: string) => {
    const { error } = await supabase.from("school_classes").delete().eq("id", classId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setClasses(c => c.filter(x => x.id !== classId));
  };

  // Get levels that have classes in a specific department, plus all levels (for adding)
  const getLevelsForDept = (deptId: string) => {
    const classesInDept = classes.filter(c => c.departmentId === deptId);
    const levelIds = [...new Set(classesInDept.map(c => c.levelId))];
    // Also include levels that might not have classes yet but were added
    return levels;
  };

  const getClassesForDeptLevel = (deptId: string, levelId: string) => {
    return classes.filter(c => c.departmentId === deptId && c.levelId === levelId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">School Info</h1>
          <p className="text-muted-foreground mt-1">Manage departments, levels, and classes</p>
        </div>
        <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Add Department</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="Department name"
                className="bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && addDepartment()}
              />
              <Textarea
                value={deptDescription}
                onChange={(e) => setDeptDescription(e.target.value)}
                placeholder="Department description"
                className="bg-secondary border-border h-24"
              />
              <Button onClick={addDepartment} className="w-full gradient-primary text-primary-foreground">Add Department</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {departments.map((dept) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
          >
            {/* Department Header */}
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleDept(dept.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-card-foreground">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{dept.description || "No description provided."}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedDepts.includes(dept.id) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedDepts.includes(dept.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3">
                    {/* Levels Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Levels</span>
                      <div className="flex items-center gap-2">
                        <Dialog open={levelDialogOpen === dept.id} onOpenChange={(open) => setLevelDialogOpen(open ? dept.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border text-foreground">
                              <Plus className="w-3 h-3 mr-1" /> Level
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader><DialogTitle className="text-foreground">Add Level</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <Input
                                value={levelName}
                                onChange={(e) => setLevelName(e.target.value)}
                                placeholder="Level name"
                                className="bg-secondary border-border"
                                onKeyDown={(e) => e.key === "Enter" && addLevel(dept.id)}
                              />
                              <Button onClick={() => addLevel(dept.id)} className="w-full gradient-primary text-primary-foreground">Add Level</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); deleteDepartment(dept.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Levels List */}
                    {levels.map((level) => {
                      const levelKey = `${dept.id}-${level.id}`;
                      const levelClasses = getClassesForDeptLevel(dept.id, level.id);
                      
                      return (
                        <div key={level.id} className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleLevel(levelKey)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedLevels.includes(levelKey) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium text-foreground">{level.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Dialog
                                open={classDialogOpen?.deptId === dept.id && classDialogOpen?.levelId === level.id}
                                onOpenChange={(open) => setClassDialogOpen(open ? { deptId: dept.id, levelId: level.id } : null)}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground h-7 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Class
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border">
                                  <DialogHeader><DialogTitle className="text-foreground">Add Class to {level.name}</DialogTitle></DialogHeader>
                                  <div className="space-y-3">
                                    <Input
                                      value={className}
                                      onChange={(e) => setClassName(e.target.value)}
                                      placeholder="Class name"
                                      className="bg-secondary border-border"
                                      onKeyDown={(e) => e.key === "Enter" && addClass(dept.id, level.id)}
                                    />
                                    <Button onClick={() => addClass(dept.id, level.id)} className="w-full gradient-primary text-primary-foreground">Add Class</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); deleteLevel(level.id); }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedLevels.includes(levelKey) && levelClasses.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-3 flex flex-wrap gap-2">
                                  {levelClasses.map((cls) => (
                                    <span
                                      key={cls.id}
                                      className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-sm"
                                    >
                                      {cls.name}
                                      <button
                                        onClick={() => deleteClass(cls.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {levels.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No levels added yet</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No departments added yet. Click "Add Department" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
