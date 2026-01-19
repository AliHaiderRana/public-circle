import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CustomBreadcrumbs } from '@/components/custom-breadcrumbs';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqCategories = [
  {
    id: 'general',
    name: 'General',
    questions: [
      {
        question: 'What is Public Circles?',
        answer:
          'Public Circles is a comprehensive email marketing platform that helps businesses create, send, and track beautiful email campaigns. We provide tools for contact management, automation, analytics, and more.',
      },
      {
        question: 'How do I get started?',
        answer:
          'Getting started is easy! Simply sign up for a free account, verify your email, and you can start creating your first email campaign. We offer a 14-day free trial with full access to all features.',
      },
      {
        question: 'Do I need a credit card to sign up?',
        answer:
          'No, you can sign up and start using Public Circles without a credit card. We offer a free trial that doesn\'t require payment information upfront.',
      },
      {
        question: 'What happens after my free trial ends?',
        answer:
          'After your free trial ends, you can choose to upgrade to a paid plan or continue with our free tier (if available). We\'ll notify you before your trial expires so you can make a decision.',
      },
    ],
  },
  {
    id: 'pricing',
    name: 'Pricing & Plans',
    questions: [
      {
        question: 'What pricing plans do you offer?',
        answer:
          'We offer three main plans: Starter ($29/month), Professional ($99/month), and Enterprise (custom pricing). Each plan includes different features and limits based on your needs.',
      },
      {
        question: 'Can I change my plan later?',
        answer:
          'Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated, so you only pay for what you use.',
      },
      {
        question: 'Do you offer refunds?',
        answer:
          'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact our support team for a full refund.',
      },
      {
        question: 'Are there any hidden fees?',
        answer:
          'No hidden fees! Our pricing is transparent. The only additional costs would be if you exceed your plan\'s limits, which we\'ll notify you about in advance.',
      },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    questions: [
      {
        question: 'What email templates are available?',
        answer:
          'We offer hundreds of professionally designed email templates across various industries. You can also create custom templates using our drag-and-drop editor or import your own HTML templates.',
      },
      {
        question: 'Can I automate my email campaigns?',
        answer:
          'Yes! Our automation features allow you to create complex workflows based on triggers, conditions, and schedules. Set up welcome series, abandoned cart emails, and more.',
      },
      {
        question: 'How does contact segmentation work?',
        answer:
          'Our advanced segmentation allows you to filter contacts based on any field, behavior, or custom criteria. Create segments for targeted campaigns and better engagement.',
      },
      {
        question: 'What analytics do you provide?',
        answer:
          'We provide comprehensive analytics including open rates, click rates, bounce rates, unsubscribe rates, and more. You can also track individual contact engagement and campaign performance over time.',
      },
    ],
  },
  {
    id: 'support',
    name: 'Support & Help',
    questions: [
      {
        question: 'What support options are available?',
        answer:
          'We offer email support for all plans, priority support for Professional plans, and dedicated account management for Enterprise customers. We also have extensive documentation and video tutorials.',
      },
      {
        question: 'How quickly do you respond to support requests?',
        answer:
          'Response times vary by plan: Starter plans receive responses within 24-48 hours, Professional plans within 12-24 hours, and Enterprise customers get priority support with faster response times.',
      },
      {
        question: 'Do you offer training or onboarding?',
        answer:
          'Yes! We provide onboarding assistance for all new customers. Enterprise customers receive dedicated onboarding sessions and training for their team.',
      },
      {
        question: 'Where can I find documentation?',
        answer:
          'Our comprehensive documentation is available in our Help Center. You can also access video tutorials, API documentation, and best practices guides.',
      },
    ],
  },
  {
    id: 'technical',
    name: 'Technical',
    questions: [
      {
        question: 'What email deliverability features do you have?',
        answer:
          'We use industry-leading email infrastructure with SPF, DKIM, and DMARC authentication. We also provide dedicated IP options for Enterprise customers and real-time bounce/complaint monitoring.',
      },
      {
        question: 'Can I integrate with other tools?',
        answer:
          'Yes! We offer integrations with popular CRM systems, e-commerce platforms, analytics tools, and more. We also provide a robust API for custom integrations.',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Absolutely. We use enterprise-grade security including encryption at rest and in transit, regular security audits, GDPR compliance, and SOC 2 certification.',
      },
      {
        question: 'What happens if I exceed my plan limits?',
        answer:
          'We\'ll notify you when you approach your limits. You can either upgrade your plan or purchase additional credits. We never automatically charge you without your approval.',
      },
    ],
  },
];

export default function FAQsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = useMemo(() => {
    if (!searchTerm && !selectedCategory) {
      return faqCategories;
    }

    return faqCategories.map((category) => {
      const filteredQuestions = category.questions.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedCategory && category.id !== selectedCategory) {
        return { ...category, questions: [] };
      }

      if (searchTerm && filteredQuestions.length === 0) {
        return { ...category, questions: [] };
      }

      return { ...category, questions: filteredQuestions };
    });
  }, [searchTerm, selectedCategory]);

  const allQuestions = useMemo(() => {
    return faqCategories.flatMap((category) =>
      category.questions.map((q) => ({ ...q, category: category.name }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return allQuestions.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allQuestions]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <CustomBreadcrumbs
            links={[
              { name: 'Home', href: '/' },
              { name: 'FAQs' },
            ]}
            heading="Frequently Asked Questions"
            description="Find answers to common questions about Public Circles"
          />
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-muted/50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {faqCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Content */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          {searchTerm && searchResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No FAQs found matching &quot;{searchTerm}&quot;. Try a different search term.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {filteredFAQs.map(
                (category) =>
                  category.questions.length > 0 && (
                    <div key={category.id}>
                      <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, index) => (
                          <AccordionItem
                            key={index}
                            value={`${category.id}-${index}`}
                            className="border-b"
                          >
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <Card>
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Can't find the answer you're looking for? Please contact our friendly team.
              </p>
              <Button asChild>
                <a href="/contact-us">Contact Us</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
