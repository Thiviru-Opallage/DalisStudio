import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Hero Section
  const heroExists = await prisma.hero_section.findFirst();
  if (!heroExists) {
    await prisma.hero_section.create({
      data: {
        base_image: "/hero-base.jpg",
        hover_image: "/hero-hover.jpg",
        title: "Dalis Studio",
      },
    });
    console.log("Seeded hero_section");
  }

  // 2. Quote Bracket Images
  const bracketOneImages = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop",
  ];
  const bracketTwoImages = [
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
  ];
  const bracketThreeImages = [
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526758097130-bab247274f58?q=80&w=600&auto=format&fit=crop",
  ];

  const bracketCount = await prisma.quote_bracket_image.count();
  if (bracketCount === 0) {
    for (let i = 0; i < bracketOneImages.length; i++) {
      await prisma.quote_bracket_image.create({
        data: { bracket_group: 1, image_url: bracketOneImages[i], sort_order: i },
      });
    }
    for (let i = 0; i < bracketTwoImages.length; i++) {
      await prisma.quote_bracket_image.create({
        data: { bracket_group: 2, image_url: bracketTwoImages[i], sort_order: i },
      });
    }
    for (let i = 0; i < bracketThreeImages.length; i++) {
      await prisma.quote_bracket_image.create({
        data: { bracket_group: 3, image_url: bracketThreeImages[i], sort_order: i },
      });
    }
    console.log("Seeded quote_bracket_image");
  }

  // 3. Signature Works
  const sigCount = await prisma.signature_work.count();
  if (sigCount === 0) {
    const signatureWorks = [
      {
        image_url: "/neonMirage.jpg",
        title: "Our Approach",
        description: "A systems-driven creative methodology focused on clarity, intent, and precision.",
        sort_order: 0,
      },
      {
        image_url: "/echoesOfSilence.jpg",
        title: "Our Technology",
        description: "Modern stacks, motion systems, and performance-first engineering.",
        sort_order: 1,
      },
      {
        image_url: "/the-digital-renaissance.jpg",
        title: "Our Craft",
        description: "Every pixel refined, every transition intentional, every interaction weighted.",
        sort_order: 2,
      },
    ];
    for (const work of signatureWorks) {
      await prisma.signature_work.create({ data: work });
    }
    console.log("Seeded signature_work");
  }

  // 4. Works Grid Items
  const gridCount = await prisma.works_grid_item.count();
  if (gridCount === 0) {
    const worksData = [
      { id: 1, title: "Joker", image: "/joker.jpg", width_class: "w-36", height_class: "h-48", top_class: "top-[40%]", left_class: "left-[12%]", z_index: 10 },
      { id: 2, title: "Track Number", image: "/track.jpg", width_class: "w-55", height_class: "h-70", top_class: "top-[40%]", left_class: "left-[20%]", z_index: 21 },
      { id: 3, title: "Trump", image: "/trump.jpg", width_class: "w-44", height_class: "h-56", top_class: "top-[20%]", left_class: "left-[20%]", z_index: 20 },
      { id: 4, title: "Retro Car", image: "/retro.jpg", width_class: "w-48", height_class: "h-48", top_class: "top-[32%]", left_class: "left-[30%]", z_index: 42 },
      { id: 5, title: "Character Illustration", image: "/character.jpeg", width_class: "w-48", height_class: "h-56", top_class: "top-[58%]", left_class: "left-[31%]", z_index: 41 },
      { id: 6, title: "Abstract Art", image: "/abstract.jpg", width_class: "w-52", height_class: "h-52", top_class: "top-[12%]", left_class: "left-[30%]", z_index: 21 },
      { id: 7, title: "Lego Character", image: "/lego.jpg", width_class: "w-50", height_class: "h-52", top_class: "top-[4%]", left_class: "left-[42%]", z_index: 20 },
      { id: 8, title: "Neon Pink", image: "/pink.jpg", width_class: "w-56", height_class: "h-64", top_class: "top-[60%]", left_class: "left-[42%]", z_index: 38 },
      { id: 9, title: "Michael Jackson", image: "/mj.jpg", width_class: "w-56", height_class: "h-67", top_class: "top-[26%]", left_class: "left-[41%]", z_index: 50 },
      { id: 10, title: "Ambush Red", image: "/ambush.jpeg", width_class: "w-52", height_class: "h-68", top_class: "top-[46%]", left_class: "left-[53%]", z_index: 45 },
      { id: 11, title: "West Poster", image: "/west.jpg", width_class: "w-48", height_class: "h-60", top_class: "top-[12%]", left_class: "left-[52%]", z_index: 22 },
      { id: 12, title: "Yellow Poster", image: "/yellow.jpg", width_class: "w-48", height_class: "h-64", top_class: "top-[42%]", left_class: "left-[62%]", z_index: 35 },
      { id: 13, title: "Blue Typo", image: "/blue.jpeg", width_class: "w-44", height_class: "h-52", top_class: "top-[20%]", left_class: "left-[64%]", z_index: 18 },
      { id: 14, title: "Popular Red", image: "/popular.jpg", width_class: "w-36", height_class: "h-48", top_class: "top-[38%]", left_class: "left-[74%]", z_index: 12 },
    ];

    const mockDescriptions: Record<number, string> = {
      1: "A character study exploring contrast and mood through minimal color grading and deliberate framing.",
      2: "Typographic composition built around rhythm and repetition, treating numerals as texture rather than data.",
      3: "Bold portraiture experimenting with high-contrast lighting and graphic negative space.",
      4: "A study in form and nostalgia, rendered with clean geometry and a restrained palette.",
      5: "Character design work focused on silhouette clarity and expressive linework.",
      6: "Abstract composition exploring texture, layering, and controlled chromatic tension.",
      7: "Playful figure study balancing modular geometry with a controlled color story.",
      8: "Vivid color-first piece built to hold attention through saturation and contrast.",
      9: "Iconic portrait treatment reworked with a modern editorial lens and tonal precision.",
      10: "Fashion-forward composition pairing bold red tones with sharp, confident framing.",
      11: "Poster-style layout drawing from vintage western typography and worn textures.",
      12: "High-key composition using yellow as both subject and structural anchor.",
      13: "Typographic exploration in blue, balancing legibility with graphic abstraction.",
      14: "A punchy, high-contrast piece designed to read instantly at a glance.",
    };

    const ambientGradients: Record<number, string> = {
      1: "from-emerald-950 to-neutral-950",
      2: "from-indigo-950 to-neutral-950",
      3: "from-red-950 to-neutral-950",
      4: "from-orange-950 to-neutral-950",
      5: "from-cyan-950 to-neutral-950",
      6: "from-purple-950 to-neutral-950",
      7: "from-yellow-950 to-neutral-950",
      8: "from-pink-950 to-neutral-950",
      9: "from-zinc-800 to-neutral-950",
      10: "from-rose-950 to-neutral-950",
      11: "from-amber-950 to-neutral-950",
      12: "from-yellow-900 to-neutral-950",
      13: "from-blue-950 to-neutral-950",
      14: "from-red-900 to-neutral-950",
    };

    const ambientGradientsLight: Record<number, string> = {
      1: "from-emerald-100 via-white to-white",
      2: "from-indigo-100 via-white to-white",
      3: "from-red-100 via-white to-white",
      4: "from-orange-100 via-white to-white",
      5: "from-cyan-100 via-white to-white",
      6: "from-purple-100 via-white to-white",
      7: "from-yellow-100 via-white to-white",
      8: "from-pink-100 via-white to-white",
      9: "from-zinc-200 via-white to-white",
      10: "from-rose-100 via-white to-white",
      11: "from-amber-100 via-white to-white",
      12: "from-yellow-50 via-white to-white",
      13: "from-blue-100 via-white to-white",
      14: "from-red-50 via-white to-white",
    };

    for (let i = 0; i < worksData.length; i++) {
      const item = worksData[i];
      await prisma.works_grid_item.create({
        data: {
          title: item.title,
          image_url: item.image,
          width_class: item.width_class,
          height_class: item.height_class,
          top_class: item.top_class,
          left_class: item.left_class,
          z_index: item.z_index,
          description: mockDescriptions[item.id] || "",
          ambient_dark: ambientGradients[item.id] || "from-neutral-950 to-neutral-950",
          ambient_light: ambientGradientsLight[item.id] || "from-white via-white to-white",
          sort_order: i,
        },
      });
    }
    console.log("Seeded works_grid_item");
  }

  // 5. About Hero
  const aboutHeroExists = await prisma.about_hero.findFirst();
  if (!aboutHeroExists) {
    await prisma.about_hero.create({
      data: {
        base_image_dark: "/about-hero-face.png",
        hover_image_dark: "/about-colour.png",
        base_image_light: "/about-hero-face-light.png",
        hover_image_light: "/about-colour-light.png",
      },
    });
    console.log("Seeded about_hero");
  }

  // 6. About Quote Images
  const aboutQuoteCount = await prisma.about_quote_image.count();
  if (aboutQuoteCount === 0) {
    await prisma.about_quote_image.createMany({
      data: [
        {
          position: "one",
          image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
        },
        {
          position: "two",
          image_url: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=400&auto=format&fit=crop",
        },
        {
          position: "three",
          image_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop",
        },
      ],
    });
    console.log("Seeded about_quote_image");
  }

  // 7. Contact Content
  const contactExists = await prisma.contact_content.findFirst();
  if (!contactExists) {
    await prisma.contact_content.create({
      data: {
        card_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
        showreel_url: "/videos/showreel.mp4",
      },
    });
    console.log("Seeded contact_content");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
