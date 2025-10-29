/**
 * Section Type Selector Component
 * Grid of available section types for adding to page
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Layout,
  Grid3x3,
  MessageSquareQuote,
  Megaphone,
  FileText,
  Images,
  HelpCircle,
  Code,
  X,
} from 'lucide-react';

interface SectionType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const SECTION_TYPES: SectionType[] = [
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Large banner with heading, description, and CTA',
    icon: <Layout className="w-8 h-8" />,
    category: 'Marketing',
  },
  {
    id: 'features',
    name: 'Features Grid',
    description: 'Showcase features in a responsive grid layout',
    icon: <Grid3x3 className="w-8 h-8" />,
    category: 'Marketing',
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and testimonials slider',
    icon: <MessageSquareQuote className="w-8 h-8" />,
    category: 'Social Proof',
  },
  {
    id: 'cta',
    name: 'Call to Action',
    description: 'Focused section with a clear call to action',
    icon: <Megaphone className="w-8 h-8" />,
    category: 'Conversion',
  },
  {
    id: 'content',
    name: 'Content Block',
    description: 'Rich text content with images and formatting',
    icon: <FileText className="w-8 h-8" />,
    category: 'Content',
  },
  {
    id: 'gallery',
    name: 'Image Gallery',
    description: 'Photo gallery with lightbox and grid layouts',
    icon: <Images className="w-8 h-8" />,
    category: 'Media',
  },
  {
    id: 'faq',
    name: 'FAQ Accordion',
    description: 'Frequently asked questions with collapsible answers',
    icon: <HelpCircle className="w-8 h-8" />,
    category: 'Support',
  },
  {
    id: 'custom',
    name: 'Custom Section',
    description: 'Build your own custom section with flexible fields',
    icon: <Code className="w-8 h-8" />,
    category: 'Advanced',
  },
];

interface SectionTypeSelectorProps {
  onSelect: (sectionType: string) => void;
  onCancel: () => void;
}

export function SectionTypeSelector({ onSelect, onCancel }: SectionTypeSelectorProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Choose Section Type</CardTitle>
            <CardDescription>
              Select a section type to add to your page
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECTION_TYPES.map((type) => (
            <Card
              key={type.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => onSelect(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{type.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">
                      {type.category}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
