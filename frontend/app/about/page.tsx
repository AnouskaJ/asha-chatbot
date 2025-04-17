import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Heart, Award, Users, Target } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Our Mission</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Empowering women to achieve their full potential in their professional journeys through AI-driven support and
          community.
        </p>
        <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-400/20" />
          <img
            src="/placeholder.svg?height=600&width=1200"
            alt="Women in professional settings"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Heart className="h-10 w-10 text-pink-500" />,
              title: "Inclusivity",
              description:
                "We believe in creating opportunities for all women, regardless of background, experience, or circumstances.",
            },
            {
              icon: <Award className="h-10 w-10 text-purple-500" />,
              title: "Excellence",
              description:
                "We strive for excellence in everything we do, from our AI technology to our community support.",
            },
            {
              icon: <Users className="h-10 w-10 text-orange-500" />,
              title: "Community",
              description: "We foster a supportive community where women can connect, learn, and grow together.",
            },
            {
              icon: <Target className="h-10 w-10 text-blue-500" />,
              title: "Innovation",
              description:
                "We continuously innovate to provide the best tools and resources for women's professional development.",
            },
          ].map((value, index) => (
            <Card key={index} className="border-none shadow-md">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Asha AI was born from a vision to address the unique challenges women face in their professional journeys.
              The JobsForHer Foundation recognized that while there were many resources available, there was a need for
              personalized guidance that could adapt to each woman's individual circumstances.
            </p>
            <p className="text-muted-foreground mb-4">
              In 2023, we launched Asha AI as an innovative solution that combines artificial intelligence with human
              expertise to provide tailored career support. Our platform has since helped thousands of women find jobs,
              develop skills, connect with mentors, and build successful careers.
            </p>
            <p className="text-muted-foreground">
              Today, we continue to grow and evolve, always guided by our mission to empower women in their professional
              journeys.
            </p>
          </div>
          <div className="relative rounded-xl overflow-hidden aspect-square">
            <img src="/placeholder.svg?height=600&width=600" alt="Our team" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Anjali Sharma",
              role: "Founder & CEO",
              bio: "With over 15 years of experience in tech and leadership, Anjali founded Asha AI to help women overcome career barriers.",
              image: "/placeholder.svg?height=300&width=300",
            },
            {
              name: "Priya Patel",
              role: "Chief Technology Officer",
              bio: "Priya leads our technical team, bringing her expertise in AI and machine learning to create innovative solutions.",
              image: "/placeholder.svg?height=300&width=300",
            },
            {
              name: "Neha Reddy",
              role: "Head of Community",
              bio: "Neha builds and nurtures our community, creating spaces for women to connect, learn, and support each other.",
              image: "/placeholder.svg?height=300&width=300",
            },
            {
              name: "Ritu Gupta",
              role: "Career Development Lead",
              bio: "Ritu oversees our career development programs, ensuring they meet the diverse needs of women at all career stages.",
              image: "/placeholder.svg?height=300&width=300",
            },
            {
              name: "Meera Joshi",
              role: "Partnerships Director",
              bio: "Meera builds strategic partnerships with companies and organizations to create opportunities for our community.",
              image: "/placeholder.svg?height=300&width=300",
            },
            {
              name: "Kavita Singh",
              role: "AI Research Lead",
              bio: "Kavita leads our AI research efforts, constantly improving Asha's ability to provide personalized guidance.",
              image: "/placeholder.svg?height=300&width=300",
            },
          ].map((member, index) => (
            <Card key={index} className="overflow-hidden border-none shadow-md">
              <div className="aspect-square overflow-hidden">
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-primary mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-6">Our Partners</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
          We collaborate with leading organizations to create opportunities and resources for women in their
          professional journeys.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((partner) => (
            <div key={partner} className="flex justify-center">
              <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Partner Logo</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-xl bg-primary p-8 md:p-12 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
        <p className="max-w-2xl mx-auto mb-8">
          Be part of our community and help us empower more women in their professional journeys.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Sign Up Now
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

