import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CustomBreadcrumbs } from '@/components/custom-breadcrumbs';
import { paths } from '@/routes/paths';
import { Target, Eye, Users, Award, Heart, Lightbulb } from 'lucide-react';

const teamMembers = [
  {
    name: 'John Smith',
    role: 'CEO & Founder',
    initials: 'JS',
    bio: '10+ years in email marketing and SaaS',
  },
  {
    name: 'Sarah Johnson',
    role: 'CTO',
    initials: 'SJ',
    bio: 'Former tech lead at major email platform',
  },
  {
    name: 'Michael Chen',
    role: 'Head of Product',
    initials: 'MC',
    bio: 'Product expert with focus on user experience',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Marketing',
    initials: 'ER',
    bio: 'Marketing strategist and growth expert',
  },
];

const values = [
  {
    icon: Target,
    title: 'Customer First',
    description: 'We put our customers at the center of everything we do.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We continuously innovate to stay ahead of the curve.',
  },
  {
    icon: Heart,
    title: 'Integrity',
    description: 'We operate with honesty and transparency in all our dealings.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We strive for excellence in every aspect of our product.',
  },
];

const testimonials = [
  {
    name: 'David Williams',
    company: 'Enterprise Corp',
    content: 'Public Circles has been instrumental in our marketing success. The team is responsive and the product is exceptional.',
  },
  {
    name: 'Lisa Anderson',
    company: 'StartupHub',
    content: 'The best decision we made was switching to Public Circles. The features are powerful and the support is outstanding.',
  },
  {
    name: 'Robert Taylor',
    company: 'Growth Inc',
    content: 'We\'ve seen a 300% increase in email engagement since using Public Circles. Highly recommended!',
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <CustomBreadcrumbs
            links={[
              { name: 'Home', href: '/' },
              { name: 'About Us' },
            ]}
            heading="About Public Circles"
            description="Learn more about our mission, vision, and the team behind the platform"
          />
        </div>
      </section>

      {/* Company Information */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Who We Are
            </h2>
            <p className="text-lg text-muted-foreground">
              Public Circles is a leading email marketing platform designed to help businesses of
              all sizes create, send, and track beautiful email campaigns. Founded in 2020, we've
              grown to serve thousands of businesses worldwide.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  To empower businesses worldwide with powerful, easy-to-use email marketing tools
                  that drive growth and engagement.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  To simplify email marketing for businesses by providing intuitive tools, powerful
                  automation, and exceptional customer support.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground">
              The passionate people building Public Circles
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card key={index}>
                <CardHeader className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarFallback className="text-lg">{member.initials}</AvatarFallback>
                  </Avatar>
                  <CardTitle>{member.name}</CardTitle>
                  <Badge variant="secondary" className="mt-2">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{member.bio}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardDescription className="text-base">{testimonial.content}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
