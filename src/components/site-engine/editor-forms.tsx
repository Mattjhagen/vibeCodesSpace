'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SiteSection } from '@/lib/site-generation'

export function HeroEditor({ section, onChange }: { section: SiteSection, onChange: (content: any) => void }) {
  const { title, subtitle, cta } = section.content;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="grid gap-2">
        <Label>Headline</Label>
        <Input 
          value={title} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...section.content, title: e.target.value })} 
        />
      </div>
      <div className="grid gap-2">
        <Label>Subtitle</Label>
        <Textarea 
          value={subtitle} 
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...section.content, subtitle: e.target.value })} 
        />
      </div>
      <div className="grid gap-2">
        <Label>Call to Action Button</Label>
        <Input 
          value={cta} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...section.content, cta: e.target.value })} 
        />
      </div>
    </div>
  )
}

export function AboutEditor({ section, onChange }: { section: SiteSection, onChange: (content: any) => void }) {
  const { title, text } = section.content;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="grid gap-2">
        <Label>Section Title</Label>
        <Input 
          value={title} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...section.content, title: e.target.value })} 
        />
      </div>
      <div className="grid gap-2">
        <Label>Biography / Description</Label>
        <Textarea 
          className="min-h-[150px]"
          value={text} 
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...section.content, text: e.target.value })} 
        />
      </div>
    </div>
  )
}

export function SkillsEditor({ section, onChange }: { section: SiteSection, onChange: (content: any) => void }) {
  const { title, items } = section.content;

  const handleUpdateSkill = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange({ ...section.content, items: newItems });
  };

  const handleAddSkill = () => {
    onChange({ ...section.content, items: [...items, 'New Skill'] });
  };

  const handleRemoveSkill = (index: number) => {
    onChange({ ...section.content, items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="grid gap-2">
        <Label>Section Title</Label>
        <Input 
          value={title} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...section.content, title: e.target.value })} 
        />
      </div>
      <div className="space-y-2">
        <Label>Skills List</Label>
        {items.map((skill: string, idx: number) => (
          <div key={idx} className="flex gap-2">
            <Input 
              value={skill} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSkill(idx, e.target.value)} 
            />
            <Button variant="ghost" size="icon" onClick={() => handleRemoveSkill(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
              &times;
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={handleAddSkill} className="w-full mt-2 border-dashed">
          + Add Skill
        </Button>
      </div>
    </div>
  )
}

export function SectionEditor({ section, onChange }: { section: SiteSection, onChange: (content: any) => void }) {
  switch (section.type) {
    case 'hero':
      return <HeroEditor section={section} onChange={onChange} />
    case 'about':
      return <AboutEditor section={section} onChange={onChange} />
    case 'skills':
      return <SkillsEditor section={section} onChange={onChange} />
    default:
      return <div className="p-4 bg-muted/20 border rounded-lg text-sm text-center italic">This section type cannot be edited yet.</div>
  }
}
