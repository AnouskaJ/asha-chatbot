"use client"

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function FaqPage() {
  const [searchTerm, setSearchTerm] = useState("")

  // Define FAQs
  const faqs = [
      {
      question: "What is the JobsForHer Foundation?",
      answer: "JobsForHer Foundation is a Charitable Trust launched in 2018, dedicated to enhancing the status of women in the workplace and beyond. Located in Bengaluru, the foundation is committed to promoting positive transformation and ensuring equal opportunities for women throughout India."
      },
      {
      question: "What is the mission of JobsForHer Foundation?",
      answer: "With a keen understanding of the importance of enabling women, the trust is on a mission to foster their career advancement. This involves unlocking their untapped potential and enhancing self-confidence through initiatives in education, skill development, and facilitating connections with various career opportunities."
      },
      {
      question: "What programs does JobsForHer Foundation offer?",
      answer: "JobsForHer Foundation offers several programs including: herShakti (upskilling women in emerging technologies), Career Coaching for women returnees, Entrepreneurship Support through workshops and networking, and the DivHERsity.club for corporate leaders committed to workplace inclusion."
    },
      {
      question: "What is herShakti?",
      answer: "herShakti is a first-of-its-kind government-industry consortium to upskill women in emerging technologies. This program is presented in collaboration with the Karnataka Digital Economy Mission (KDEM), under its W@W - Women at Work initiative. It offers training in technologies like AI/ML, Big Data, Blockchain, Cyber security, IPA, and Cloud computing."
      },
      {
      question: "What is the DivHERsity.club?",
      answer: "The DivHERsity.club is a member-only community for leaders (and risers) for whom having a diverse and inclusive workplace isn't just a nice-to-have, it's a must-have. It's a platform for productive discussions around important Diversity, Equity & Inclusion issues that corporate India is facing today."
      },
      {
      question: "How can I benefit from JobsForHer Foundation's programs?",
      answer: "Women looking to start, restart, or advance their careers can benefit from JobsForHer Foundation's upskilling programs, mentorship connections, networking opportunities, and access to job opportunities with partner companies that value gender diversity."
    },
      {
      question: "Does the JobsForHer Foundation help women who are returning to work after a career break?",
      answer: "Yes, JobsForHer Foundation specifically focuses on supporting women who want to restart their careers after taking breaks for various reasons. We provide skill development, mentorship, and connections to companies that understand and value the experience that women returners bring."
      },
      {
      question: "How can companies partner with JobsForHer Foundation?",
      answer: "Companies committed to gender diversity can partner with JobsForHer Foundation by providing mentorship, participating in upskilling programs, offering job opportunities to women returners, and joining the DivHERsity.club to collaborate on best practices for inclusive workplaces."
  },
  {
      question: "What is the relationship between JobsForHer Foundation and HerKey?",
      answer: "JobsForHer Foundation is a charitable trust, while HerKey (formerly JobsForHer) is a career engagement platform for women. Both organizations were founded by Neha Bagaria and share the mission of supporting women's careers, but operate as separate entities with complementary goals."
      },
      {
      question: "How does Asha AI help with the JobsForHer Foundation mission?",
      answer: "Asha AI is a career assistant tool that supports the JobsForHer Foundation mission by providing personalized guidance, information about upskilling programs, career advice, and connections to opportunities specifically for women looking to advance their careers or return to the workforce."
    }
  ]

  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container max-w-4xl py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">
          Find answers to common questions about JobsForHer Foundation and our programs
        </p>
      </div>

        <div className="relative mb-8">
          <Input
          type="text"
          placeholder="Search for questions or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

      <Accordion type="single" collapsible className="w-full">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No FAQs match your search. Try different keywords or{" "}
              <Button variant="link" className="p-0" onClick={() => setSearchTerm("")}>
                view all FAQs
            </Button>
            </p>
          </div>
        )}
      </Accordion>

      <div className="mt-12 p-6 bg-accent rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
        <p className="mb-4">
          If you couldn't find the answer you were looking for, please reach out to us directly.
          </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <p className="font-medium">Email:</p>
            <p className="text-muted-foreground">jobsforherfoundation.org</p>
          </div>
          <div className="sm:ml-10">
            <p className="font-medium">Phone:</p>
            <p className="text-muted-foreground">+91 81473 78390</p>
          </div>
          <div className="sm:ml-10">
            <p className="font-medium">Office:</p>
            <p className="text-muted-foreground">11 Kemwell House, Tumkur Road, Bengaluru – 560022</p>
          </div>
        </div>
      </div>
    </div>
  )
}

