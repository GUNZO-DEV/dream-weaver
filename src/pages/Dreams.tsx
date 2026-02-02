import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDreamDiary, DreamEntry, moodEmojis, moodLabels } from "@/hooks/useDreamDiary";
import { Plus, Search, Sparkles, X, Star, Tag, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const Dreams = () => {
  const { entries, addEntry, deleteEntry, searchEntries, getAllTags, getLucidDreams } = useDreamDiary();
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // New entry form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState<DreamEntry['mood']>('neutral');
  const [isLucid, setIsLucid] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [clarity, setClarity] = useState(3);

  const allTags = getAllTags();
  const lucidCount = getLucidDreams().length;
  
  const filteredEntries = searchQuery 
    ? searchEntries(searchQuery)
    : selectedTag
    ? entries.filter(e => e.tags.includes(selectedTag))
    : entries;

  const handleAddEntry = () => {
    if (!title.trim()) return;
    
    addEntry({
      date: new Date(),
      title,
      description,
      mood,
      isLucid,
      tags,
      clarity,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setMood('neutral');
    setIsLucid(false);
    setTags([]);
    setClarity(3);
    setIsAdding(false);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dream Diary</h1>
        <p className="text-muted-foreground text-sm mt-1">Record and explore your dreams</p>
      </motion.header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Stats Row */}
        <motion.div 
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-foreground">{entries.length}</div>
            <div className="text-xs text-muted-foreground">Total Dreams</div>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-primary">{lucidCount}</div>
            <div className="text-xs text-muted-foreground">Lucid Dreams</div>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-accent">{allTags.length}</div>
            <div className="text-xs text-muted-foreground">Themes</div>
          </div>
        </motion.div>

        {/* Search & Add */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search dreams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAdding(true)} className="gradient-primary">
            <Plus size={20} />
          </Button>
        </motion.div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <motion.div
            className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedTag === null 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedTag === tag 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}

        {/* Dream Entries */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredEntries.length === 0 ? (
              <motion.div
                className="glass-card rounded-3xl p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Sparkles size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No dreams match your search' : 'No dreams recorded yet'}
                </p>
                <Button onClick={() => setIsAdding(true)} className="mt-4 gradient-primary">
                  <Plus className="mr-2" size={18} />
                  Record First Dream
                </Button>
              </motion.div>
            ) : (
              filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  className="glass-card rounded-2xl p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{entry.title}</h3>
                          {entry.isLucid && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                              Lucid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(entry.date, 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                  
                  {entry.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {entry.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < entry.clarity ? 'text-accent fill-accent' : 'text-muted'}
                        />
                      ))}
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{entry.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Lucid Dreaming Tips */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Lucid Dreaming Tips</h3>
          <div className="space-y-3">
            {[
              { title: "Reality Checks", desc: "Check if you're dreaming multiple times daily" },
              { title: "Dream Journal", desc: "Write dreams immediately upon waking" },
              { title: "MILD Technique", desc: "Set intention before sleep to recognize dreams" },
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Add Dream Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdding(false)}
          >
            <motion.div
              className="glass-card rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-foreground mb-6">Record a Dream</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Title</label>
                  <Input
                    placeholder="What was the dream about?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                  <Textarea
                    placeholder="Describe your dream in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(moodEmojis) as DreamEntry['mood'][]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${
                          mood === m 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        <span>{moodEmojis[m]}</span>
                        <span className="text-sm">{moodLabels[m]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Clarity (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((c) => (
                      <button
                        key={c}
                        onClick={() => setClarity(c)}
                        className="p-2"
                      >
                        <Star
                          size={24}
                          className={c <= clarity ? 'text-accent fill-accent' : 'text-muted'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-primary" />
                    <span className="font-medium text-foreground">Lucid Dream?</span>
                  </div>
                  <button
                    onClick={() => setIsLucid(!isLucid)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      isLucid ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-foreground rounded-full m-1"
                      animate={{ x: isLucid ? 20 : 0 }}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} variant="outline">
                      <Tag size={18} />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full flex items-center gap-1"
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddEntry}
                  disabled={!title.trim()}
                  className="w-full h-14 gradient-primary text-lg font-semibold"
                >
                  Save Dream
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Dreams;
