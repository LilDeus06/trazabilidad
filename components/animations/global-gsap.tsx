"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function GlobalGsap() {
  const pathname = usePathname()

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    
    if (prefersReducedMotion) {
      gsap.set("*", { clearProps: "all" })
      return
    }

    // Set default GSAP settings for smooth Apple-like animations
    gsap.defaults({
      duration: 0.8,
      ease: "power2.out"
    })

    // Animate page titles (h1, h2) excluding sidebar title
    const titles = gsap.utils.toArray("h1:not(.sidebar-title), h2")
    titles.forEach((title: any) => {
      gsap.fromTo(title, 
        { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    // Animate elements with .gsap-fade class
    const fadeElements = gsap.utils.toArray(".gsap-fade")
    fadeElements.forEach((element: any, index: number) => {
      gsap.fromTo(element,
        {
          opacity: 0,
          y: 20
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    // Animate staggered containers
    const staggerContainers = gsap.utils.toArray(".gsap-stagger")
    staggerContainers.forEach((container: any) => {
      const children = container.children
      gsap.fromTo(children,
        {
          opacity: 0,
          y: 25,
          scale: 0.98
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    // Animate cards with subtle scale effect
    const cards = gsap.utils.toArray(".gsap-card")
    cards.forEach((card: any) => {
      gsap.fromTo(card,
        {
          opacity: 0,
          scale: 0.95,
          y: 20
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      )

      // Add hover effect
      card.addEventListener("mouseenter", () => {
        gsap.to(card, {
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        })
      })

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        })
      })
    })

    // Animate buttons with subtle effects
    const buttons = gsap.utils.toArray(".gsap-button")
    buttons.forEach((button: any) => {
      button.addEventListener("mouseenter", () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out"
        })
      })

      button.addEventListener("mouseleave", () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        })
      })
    })

    // Animate table rows
    const tableRows = gsap.utils.toArray(".gsap-table-row") as Element[]
    if (tableRows.length > 0) {
      gsap.fromTo(tableRows,
        {
          opacity: 0,
          x: -20
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: tableRows[0] as Element,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      )
    }

    // Parallax effect for elements with data-gsap-parallax
    const parallaxElements = gsap.utils.toArray("[data-gsap-parallax]") as Element[]
    parallaxElements.forEach((element: Element) => {
      const speed = (element as HTMLElement).dataset.gsapParallax || "0.5"
      gsap.to(element, {
        yPercent: -50 * parseFloat(speed),
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      })
    })

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }

  }, [pathname]) // Re-run animations when route changes

  return null
}
