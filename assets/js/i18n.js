/* GGC bilingual layer: Georgian is authored in the markup, English is applied on top.
   Add pairs here — key = exact Georgian text, value = English.

   The keys must match what the pages actually say, character for character. They
   had drifted: copy was rewritten over several rounds and the dictionary was
   not, so switching to English left Georgian sentences sitting in the middle of
   English pages. The list below was rebuilt by walking every page and every step
   of the form in Georgian and collecting what was really on screen. */
(function () {
  var DICT = {
    /* ------------------------------------------------------------ chrome */
    "ჰაბი": "Hub", "კომპანიები": "Companies", "თამაშები": "Games", "ჩვენ შესახებ": "About",
    "დონაცია": "Donate", "დამატება": "Submit", "მონაცემები": "Report", "რეპორტი": "Report",
    "საზოგადოება": "Community", "გამომცემლობა": "Publishing", "აქსელერაცია": "Acceleration",
    "მხარდაჭერა": "Support", "ადმინი": "Admin", "ქარ": "GE",
    "მთავარი": "Home", "კონტაქტი": "Contact", "ადამიანები": "People", "სიახლეები": "News",
    "ქართული თამაშების საზოგადოება.": "The Georgian games community.",

    /* -------------------------------------------------------------- home */
    "თამაშები იქმნება აქ": "Games are made here",
    "GGC აერთიანებს ქართულ გეიმდევ ინდუსტრიას — სტუდიებს, გუნდებს, სოლო დეველოპერებს და მათ თამაშებს. ერთ ადგილას, ვერიფიცირებულად.":
      "GGC brings the Georgian games industry together — studios, teams, solo developers and their games. In one place, verified.",
    "ვერიფიცირებული კომპანია": "verified companies",
    "ვერიფიცირებული კომპანია და გუნდი": "verified companies and teams",
    "სოლო დეველოპერი": "solo developers", "სოლო დეველოპერები": "solo developers",
    "თამაში კატალოგში": "games in the catalogue",
    "ვერიფიცირებული სტუდია": "verified studios",
    "მოსალოდნელი გამოშვება": "upcoming releases",
    "მოსალოდნელი და ახლად გამოსული": "Upcoming and just released",
    "ქართული თამაშები — მონაცემები პლატფორმებიდან ავტომატურად განახლდება.":
      "Georgian games — the data updates itself from the storefronts.",
    "მიმართულებები": "Directions",
    "ოთხი მიმართულება": "Four directions",
    "მალე განახლდება": "coming soon",
    "ნახე ყველა": "See all",
    "გაიგე მეტი →": "Read more →",
    "რა იგეგმება →": "what is planned →",
    "ნახე მონაცემები →": "see the report →",
    "დაამატე შენი სტუდია": "Add your studio",
    "დაამატე თამაში": "Add a game",
    "დაამატე სტუდია": "Add a studio",
    "ყველა თამაში →": "All games →",
    "ყველა სტუდია →": "All studios →",
    "მითაფები, გეიმჯემები, მასტერკლასები და ერთი ცოცხალი კომუნითი, სადაც ინდუსტრია რეალურად ხვდება ერთმანეთს.":
      "Meetups, game jams, masterclasses and one living community where the industry actually meets.",
    "სტრატეგია, ბიზნეს-მოდელი, Steam-ზე გამოშვება, მენტორშიპი, ჟანრის და ბაზრის ანალიზი, წვდომა კონტენტ-კრეატორების და გამომცემლების ბაზაზე.":
      "Strategy, business model, shipping on Steam, mentorship, genre and market analysis, access to a base of content creators and publishers.",
    "ინკუბატორი, კოჰორტები და დაფინანსება სტუდიებისთვის, რომლებიც უკვე მზად არიან გაზრდისთვის.":
      "An incubator, cohorts and funding for studios that are already ready to grow.",
    "ქართული თამაშების ბაზა, სტუდიების სტატისტიკა და წლიური რეპორტები — ის რიცხვები, რომლებზეც ინდუსტრია დაყრდნობით ლაპარაკობს.":
      "A catalogue of Georgian games, studio statistics and annual reports — the numbers the industry can actually cite.",
    "მენტორშიპი": "Mentorship", "ინვესტორები": "Investors",
    "ინდუსტრიის მონაცემები": "Industry data",

    /* --------------------------------------------------------------- hub */
    "ოთხი მიმართულება, ერთ ადგილას": "Four directions, one place",
    "მიმართულება 01": "Direction 01", "მიმართულება 02": "Direction 02",
    "მიმართულება 03": "Direction 03", "მიმართულება 04": "Direction 04",
    "მითაფი": "Meetup", "გეიმჯემი": "Game jam", "მასტერკლასი": "Masterclass",
    "შემაჯამებელი ივენთი": "Year-end event",
    "თვეში ერთხელ": "monthly", "წელიწადში ორჯერ": "twice a year",
    "სეზონურად": "seasonal", "დეკემბერში": "in December",
    "2026 კალენდარი": "2026 calendar",
    "თარიღები შესაძლოა შეიცვალოს": "dates may change",
    "გასული ივენთები": "Past events",
    "ჩატარდა": "past", "რეგისტრაცია": "registration open", "მალე": "soon",
    "ყველაფერი Telegram-ში ხდება": "Everything happens on Telegram",
    "შემოგვიერთდი": "Join us", "შემოგვიერთდი Telegram-ზე": "Join us on Telegram",
    "კალენდარი": "Calendar",
    "ინვესტორებისთვის": "For investors",
    "დაგვიკავშირდი": "Get in touch",
    "წლიური რეპორტები": "Annual reports",
    "გამოშვებები წლების მიხედვით": "Releases by year",
    "ჟანრები": "Genres", "პლატფორმები": "Platforms",
    "სტუდიები ქალაქების მიხედვით": "Studios by city",
    "კატალოგში ნახვა →": "See in the catalogue →",
    "კოჰორტები": "Cohorts", "დაფინანსება": "Funding", "რელოკაცია": "Relocation",
    "მაინტერესებს — შემატყობინეთ": "I'm interested — notify me",
    "სანამ — გამომცემლობა": "Meanwhile — publishing",
    "ჩვენი საქმე 4 ნაწილად იყოფა. აირჩიე მიმართულება და დეტალებს იქვე ნახავ.":
      "GGC's work splits into four parts. Pick a direction — the detail appears below.",
    "მითაფები, ჯემები, მასტერკლასები": "Meetups, jams, masterclasses",
    "დაფინანსება, პორტინგი, გამოშვება": "Funding, porting, release",
    "ინკუბატორი და ზრდის პროგრამა": "Incubator and growth programme",
    "ინდუსტრიის მონაცემები რიცხვებში": "Industry data in numbers",
    "ერთი თემა, ორი სპიკერი და ერთი საათი კითხვა-პასუხისთვის. დასწრება უფასოა და რეგისტრაციას არ მოითხოვს.":
      "One topic, two speakers, an hour of questions. Free, no registration.",
    "48 საათი, გუნდები ადგილზე იკრიბებიან და ბოლოს ყველა ერთმანეთის თამაშს ვტესტავთ.":
      "48 hours, teams form on site, and at the end everyone plays each other's games.",
    "პრაქტიკული სესია კონკრეტულ უნარებზე: 2D, 3D, პროგრამირება თუ ბიზნესი.":
      "A hands-on session on one skill — 2D, 3D, programming or business.",
    "წლის შეჯამება, ახალი თამაშების შოუქეისი და ინდუსტრიის დიდი შეკრება.":
      "The year in review, a showcase of new games and the industry's big get-together.",
    "ივენთების ანონსები, ვაკანსიები, დახმარება და ისეთი კითხვები, რაზეც სხვაგან პასუხს ვერ იპოვი.":
      "Event announcements, job posts, help, and the questions you won't get answered anywhere else.",
    "Facebook-ის გვერდიდან": "from the Facebook page",
    "პორტინგი": "Porting", "მარკეტინგი": "Marketing",
    "ბიზნეს-განვითარება": "Business development", "პორტფელი": "Portfolio",
    "პროდაქშენის ბიუჯეტი ან თანადაფინანსება კონკრეტულ ეტაპზე.":
      "A production budget or co-funding at a specific stage.",
    "კონსოლებზე და მაღაზიებზე გამოშვების ტექნიკური ნაწილი.":
      "The technical side of shipping to consoles and stores.",
    "ვიშლისტები, სტრიმერები, ფესტივალები, პრეს-კიტი.":
      "Wishlists, streamers, festivals, press kit.",
    "კონტრაქტები, პლატფორმებთან ურთიერთობა, გარიგებები.":
      "Contracts, platform relations, deals.",
    "გამოგვიგზავნე თამაში": "Send us your game",
    "პიჩ-დეკი, ბილდი ან უბრალოდ იდეა — ყველაფერს ვუყურებთ. პასუხს ორ კვირაში იღებ.":
      "A pitch deck, a build or just an idea — we look at everything. You get an answer within two weeks.",
    "შესაძლებელია ინვესტიციის ჩადება როგორც კონკრეტულ თამაშში, ისე სტუდიაში. მოგვწერე და გამოგიგზავნით პროექტების მოკლე მიმოხილვას.":
      "You can invest in a single game or in a studio. Write to us and we'll send a short overview of the projects.",
    "თუ ეძებ, სად შედის ფული ქართულ გეიმდევში — ეს გვერდი საწყისი წერტილია. სრული პორტფელი, ეტაპები და გუნდები მოთხოვნისთანავე.":
      "If you're looking for where the money goes in Georgian gamedev, this page is the starting point. Full portfolio, milestones and teams on request.",
    "ინკუბატორი და აქსელერატორი ქართული სტუდიებისთვის, რომლებიც უკვე მზად არიან გაზრდისთვის. პროგრამა ჯერ იწერება — ქვემოთ ის მიმართულებებია, რომლებზეც ვმუშაობთ.":
      "An incubator and accelerator for Georgian studios that are already ready to grow. The programme is still being written — below are the directions we're working on.",
    "3-6 სტუდია ერთ ნაკადში, ფიქსირებული ხანგრძლივობა და ეტაპები.":
      "3-6 studios per cohort, with a fixed length and milestones.",
    "გრანტი ან თანადაფინანსება კონკრეტულ ეტაპზე, გამჭვირვალე პირობებით.":
      "A grant or co-funding at a specific stage, on transparent terms.",
    "უცხოური სტუდიების საქართველოში გადმოსვლის მხარდაჭერა.":
      "Support for foreign studios relocating to Georgia.",
    "ქართული გეიმდევი 2025": "Georgian gamedev 2025",
    "ქართული გეიმდევი 2024": "Georgian gamedev 2024",
    "სტუდიების გამოკითხვა 2024": "Studio survey 2024",
    "PDF · მალე": "PDF · soon",
    "2D არტი თამაშებში": "2D art in games", "3D არტი თამაშებში": "3D art in games",
    "პროგრამირება თამაშებში": "Programming in games",
    "საერთაშორისო მითაფი": "International meetup",
    "48 საათი · ტექნოპარკი": "48 hours · Technopark",
    "სტუმრები საზღვარგარეთიდან": "Guests from abroad",
    "წლის შედეგები": "The year in review",
    "GameJam 2025: შემაჯამებელი": "GameJam 2025 — wrap-up",
    "მითაფი: 2D არტი თამაშებში": "Meetup: 2D art in games",
    "მასტერკლასი: Unity-ს ოპტიმიზაცია": "Masterclass: Unity optimisation",
    "GGC კონფერენცია": "GGC conference",

    /* --------------------------------------------------------- catalogue */
    "ქართული სტუდიები": "Georgian studios", "ქართული თამაშები": "Georgian games",
    "ყველა ქართული სტუდია, გუნდი და სოლო დეველოპერი ერთ სიაში. მონაცემები ვალიდირებულია GGC-ის მიერ.":
      "Every Georgian studio, team and solo developer in one list. The data is validated by GGC.",
    "მონაცემები, ფოტოები და ფასები პლატფორმებიდან ავტომატურად მოდის. ყველა თამაში მიბმულია სტუდიაზე.":
      "Data, art and prices come from the storefronts automatically. Every game is attached to a studio.",
    "რეგისტრირებული კომპანიები": "Registered companies", "გუნდები": "Teams",
    "რეგისტრირებული კომპანია": "Registered company", "გუნდი": "Team", "სოლო": "Solo",
    "ყველა": "All", "მოსალოდნელი": "Upcoming", "გამოსული": "Released",
    "ყველა წელი": "All years", "ძებნა": "Search", "ძებნა სახელით": "Search by name",
    "ძებნა სახელით ან ID-ით": "Search by name or ID",
    "ძებნა თამაშით ან სტუდიით": "Search by game or studio",
    "ვერაფერი მოიძებნა": "Nothing found",
    "სცადე სხვა ფილტრი, ან": "Try another filter, or",
    "გაასუფთავე ფილტრები, ან": "Clear the filters, or",
    "შენი სტუდია სიაში არაა?": "Your studio isn't listed?",
    "დაამატე ოფიციალური სახელით, მიამაგრე თამაშები და გამოგზავნე — ჩვენ დავავალიდირებთ.":
      "Add it under its official name, attach your games and send — we'll validate it.",
    "დალაგება: სახელი": "Sort: name",
    "დალაგება: თამაშების რიცხვი": "Sort: number of games",
    "დალაგება: დაფუძნების წელი": "Sort: year founded",
    "თამაში · მოსალოდნელი პირველ რიგში, შემდეგ ახლიდან ძველისკენ":
      "Games · upcoming first, then newest to oldest",
    "აქტიური": "active", "არააქტიური": "inactive",
    "არააქტიურების ჩვენება": "show inactive", "არააქტიურებიც": "including inactive",
    "ვერიფიცირებული": "verified", "✔ ვერიფიცირებული": "✔ verified",
    "თამაში": "games", "სტუდია": "studio",
    "ოფიციალური სახელი": "Legal name", "საიდენტიფიკაციო": "Registry ID",
    "ქალაქი": "City", "დაფუძნება": "Founded", "სტატუსი": "Status",
    "გუნდის ზომა": "Team size",
    "GGC ვალიდაცია": "GGC validation", "ვალიდაცია": "validated",
    "შეცდომაა? შეგვატყობინე": "Suggest an edit",
    "თამაში ჯერ არ არის მიმაგრებული": "No games attached yet",
    "გამოშვება": "Release", "ჟანრი": "Genre", "პლატფორმა": "Platform",
    "ძრავი": "Engine", "ფასი": "Price", "ენები": "Languages",
    "დახურვა": "Close",
    "მონაცემები შევსებულია ხელით": "Filled in by hand",

    /* ---------------------------------------------------------- the form */
    "მონაცემების გაგზავნა": "Submit data",
    "ინფორმაციის გაგზავნა": "Submit data",
    "შენ ავსებ — ჩვენ ვამოწმებთ და ვაქვეყნებთ. კომპანია ყოველთვის ოფიციალური სახელით იდენტიფიცირდება, თამაში კი მიბმულია კომპანიაზე.":
      "You fill it in — we check it and publish it. A record is always identified by its official name, and a game is always attached to one.",
    "ქმედება": "Action", "იდენტიფიკაცია": "Identification", "დეტალები": "Details",
    "გადახედვა": "Review", "ცოცხალი გადახედვა": "Live preview",
    "დაამატე სტუდია, გუნდი ან სოლო დეველოპერი": "Add a studio, a team or a solo developer",
    "რეგისტრირებული კომპანია, არარეგისტრირებული გუნდი ან ერთი ადამიანი — რომელიც კატალოგში ჯერ არ არის.":
      "A registered company, an unregistered team or one person — anyone not in the catalogue yet.",
    "თამაშის დამატება": "Add a game",
    "იპოვე შენი ჩანაწერი — სტუდია, გუნდი თუ საკუთარი სახელი — და მიამაგრე თამაში. მაღაზიის ლინკიდან ყველაფერი ავტომატურად ივსება.":
      "Find your record — a studio, a team or your own name — and attach the game. A store link fills in the rest.",
    "არსებული მონაცემის შესწორება": "Correct existing data",
    "რამე არასწორია ან შეიცვალა — მოითხოვე ედიტი.": "Something is wrong or has changed — request an edit.",
    "ყველაზე მარტივი გზა — მაღაზიის გვერდი": "The easiest way — your store page",
    "ჩასვი შენი (ან შენი სტუდიის) გვერდი Steam-ზე (სასურველია), itch.io-ზე, App Store-ზე ან Google Play-ზე. სახელს, ვებსაიტს, სოციალურ ქსელებს და ყველა თამაშს ავტომატურად შევავსებთ — შენ მხოლოდ დანარჩენს დაამატებ.":
      "Paste your page — or your studio's — on Steam (preferred), itch.io, the App Store or Google Play. We fill in the name, the website, the social accounts and every game; you add the rest.",
    "ჩასვი შენი სტუდიის გვერდი — Steam-ის publisher/developer გვერდი, itch.io-ს პროფილი, App Store-ის ან Google Play-ის დეველოპერის გვერდი. ჩვენ თვითონ ვიპოვით ყველა თამაშს და შევავსებთ თითოეულის მონაცემებს.":
      "Paste your studio page — a Steam publisher/developer page, an itch.io profile, an App Store or Google Play developer page. We find every game and fill each one in.",
    "სტუდიის გვერდი": "Studio page",
    "ყველა თამაშის წამოღება": "Import every game",
    "ყველა თამაში ერთბაშად": "Every game at once",
    "ან ჩაწერე სახელით": "Or type the name",
    "იპოვე შენი ჩანაწერი": "Find your record",
    "ვის ეკუთვნის თამაში?": "Who does the game belong to?",
    "ჩაწერე სახელი — კომპანიის, გუნდის ან შენი. იპოვი და იქვე შეასწორებ.":
      "Type the name — a company's, a team's or your own. Find it and correct it right there.",
    "თუ მაღაზიის გვერდი არ გაქვს, ჩაწერე სახელი — კომპანიის, გუნდის ან შენი. თუ უკვე არსებობს, ედიტს მოითხოვ; თუ არა, აქვე შექმნი.":
      "If you have no store page, type the name — a company's, a team's or your own. If it exists you can request an edit; if not, you create it here.",
    "იპოვე სტუდია, რომელსაც თამაში მიება. თუ სიაში არაა, ჯერ სტუდია უნდა დაემატოს.":
      "Find the studio the game belongs to. If it isn't listed, the studio has to be added first.",
    "სახელი — მაგ. GGC Games LLC, GGC Games ან გიორგი ჩხაიძე":
      "A name — e.g. GGC Games LLC, GGC Games, or a person's full name",
    "ვერ მოიძებნა — შექმენი ახალი": "Not found — create it",
    "სახელი გახდება იდენტიფიკატორი, რომელზეც თამაშები მიება — კომპანიის ოფიციალური სახელი, გუნდის სახელი ან შენი სახელი და გვარი.":
      "The name becomes the identifier that games attach to — a company's legal name, a team's name, or your own name and surname.",
    "ახლის შექმნა": "Create new",
    "თამაშის მიმაგრება": "Attach a game", "არსებულის შესწორება": "Request an edit",
    "უკვე კატალოგშია —": "Already in the catalogue —",
    "თავიდან დაწყება": "Start over",
    "გაგრძელებულია ადრე დაწყებული შევსება": "Picked up where you left off",
    ". თუ სხვა სტუდიას ამატებ, დააჭირე „თავიდან დაწყებას“.":
      ". If you're adding a different studio, press “Start over”.",
    "მონახაზი ინახება": "Draft saved", "დრაფტი ინახება": "Draft saved",
    "კომპანიის მონაცემები": "Company details", "გუნდის მონაცემები": "Team details",
    "შენი მონაცემები": "Your details", "შესწორებული მონაცემები": "Corrected details",
    "ვინ ხარ": "Who you are", "ტიპი": "Kind",
    "რას აკეთებთ": "What you do", "რას აკეთებ": "What you do",
    "ოფიციალურად რეგისტრირებული კომპანია — პრიორიტეტული ჩანაწერი, სჭირდება საიდენტიფიკაციო ნომერი.":
      "An officially registered company — the strongest kind of record; needs a registry number.",
    "არარეგისტრირებული გუნდი — იდენტიფიკატორი გუნდის სახელია.":
      "An unregistered team — the team's name is the identifier.",
    "ერთი ადამიანი — იდენტიფიკატორი პირადი სახელია.":
      "One person — your own name is the identifier.",
    "სოციალური ქსელები": "Social accounts", "მაღაზიები": "Storefronts",
    "ლინკები და სოციალური ქსელები": "Links and social accounts",
    "ლოგო მაღაზიიდან": "Logo from the store",
    "ეს სურათი შენი მაღაზიის გვერდიდანაა და ჩანაწერს თან გაჰყვება. სხვა ლოგო თუ გინდა, მიწერე შენიშვნებში.":
      "This picture comes from your store page and will travel with the record. If you'd rather use another logo, say so in the notes.",
    "აირჩიე": "Choose",
    /* field labels — the asterisk is handled by a pattern, so the bare label is enough */
    "ოფიციალური სახელი": "Legal name",
    "საიდენტიფიკაციო ნომერი": "Registry number",
    "საჯარო სახელი": "Public name",
    "გუნდის სახელი": "Team name",
    "სახელი და გვარი": "Name and surname",
    "სახელი საიტზე": "Name on the site",
    "ოფიციალურად დაფუძნების წელი": "Year officially founded",
    "ჩამოყალიბების წელი": "Year the team formed",
    "დაბადების წელი": "Year of birth",
    "დაფუძნების წელი": "Year founded",
    "აღწერა": "About", "აღწერა (English)": "About (English)",
    "ჩემს შესახებ": "About me", "ჩემს შესახებ (English)": "About me (English)",
    "ვებსაიტი": "Website", "ვებსაიტი ან პორტფოლიო": "Website or portfolio",
    "ელფოსტა": "Email", "ტელეფონი (არასავალდებულო)": "Phone (optional)",
    "საკონტაქტო პირი და კავშირი": "Contact person and handle",
    "სახელი გვარი · @telegram": "Name Surname · @telegram",
    "გიორგი ჩხაიძე": "Name Surname",
    "ქართული ინდი სტუდია…": "A Georgian indie studio…",
    "ქართული ინდი გუნდი…": "A Georgian indie team…",
    "ვაკეთებ ინდი თამაშებს…": "I make indie games…",
    /* games step */
    "დაამატე იმდენი თამაში, რამდენიც გაქვს. მაღაზიის ლინკიდან ყველაფერი ავტომატურად ივსება.":
      "Add as many games as you have. A store link fills each one in.",
    "+ კიდევ ერთი თამაშის დამატება": "+ Add another game",
    "მაღაზიის ლინკი მაქვს": "I have a store link", "ხელით შევავსებ": "I'll fill it in by hand",
    "კი, გვერდი მაქვს": "Yes, I have a store page",
    "არა, ხელით შევავსებ": "No, I'll fill it in",
    "მოხსნა": "Remove", "წაკითხვა": "Read", "ხელახლა წაკითხვა": "Read again",
    "იკითხება…": "reading…",
    "სურათები მაღაზიიდან": "Art from the store",
    "თამაში არ დაგიმატებია": "You haven't added a game",
    "თამაშის სახელი": "Game title",
    /* review + send */
    "გაგზავნამდე": "Before you send",
    "სტუდიის სახელი": "Studio name",
    "ახალი სტუდია": "New studio",
    "რა იგზავნება": "What gets sent",
    "დაუსრულებელი ველები არ იგზავნება — ადმინისტრაცია მათ ჩვენს მხარეს შეავსებს.":
      "Empty fields are not sent — we'll fill those in on our side.",
    "შევსებული მონაცემი ინახება ბრაუზერში — გვერდის განახლებაც არაფერს შლის. გაგზავნის შემდეგ GGC-ის ადმინისტრაცია გადაამოწმებს და გამოქვეყნდება.":
      "What you fill in is kept in your browser — reloading the page loses nothing. Once sent, GGC reviews it and publishes it.",
    "ჯერ ერთი-ორი ველი დარჩა": "A field or two still missing",
    "შესავსებია:": "Still to fill in:",
    ". დაბრუნდი „უკან“ და შეავსე — ამის გარეშე ვერ გამოვაქვეყნებთ.":
      ". Go “Back” and fill them in — we can't publish without them.",
    "ოფიციალური სახელი · ქალაქი · წელი": "Legal name · city · year",
    "ვალიდაციის მოლოდინში": "awaiting validation",
    "როლები არ არის მითითებული": "no roles set",
    "შემდეგი": "Next", "უკან": "Back", "გაგზავნა": "Send",
    "გაიგზავნა": "Sent", "იგზავნება…": "Sending…", "ვერ გაიგზავნა": "Couldn't send",
    "ხელახლა გაგზავნა": "Send again",
    "მონაცემები გადაეგზავნა GGC-ის ადმინისტრაციას და გადამოწმდება. როგორც კი დავადასტურებთ, საიტზე გამოჩნდება.":
      "Your data has gone to GGC for review. As soon as we confirm it, it appears on the site.",
    "გაგზავნა ვერ მოხერხდა — შენი მონაცემები არსად დაკარგულა, უბრალოდ სცადე ხელახლა.":
      "It couldn't be sent — nothing you filled in is lost, just try again.",
    "სერვერამდე ვერ მივიდა.": "It didn't reach the server.",
    "კატალოგში დაბრუნება": "Back to the catalogue",
    "კიდევ ერთის დამატება": "Add another",
    "ჩასვი მაღაზიის ბმული": "Paste the store link",
    "ავტომატურად ვერ წავიკითხეთ — შეავსე ხელით, ბმულს ჩვენ თვითონ დავამუშავებთ":
      "We couldn't read it automatically — fill it in by hand and we'll process the link ourselves",
    "ამ გვერდიდან მონაცემები ვერ წაიკითხა": "Nothing could be read from that page",
    "ამ გვერდიდან სტუდიის მონაცემები ვერ წაიკითხა": "No studio details could be read from that page",
    "ეს სტუდიის გვერდი არ არის": "That isn't a studio page",
    "პასუხი JSON არ არის": "The response is not JSON",
    "ცარიელი ბმული": "Empty link",

    /* Months, both spellings. The calendar prints the short form on its own and
       the past-events list prints "month year" — which the pattern below builds
       out of these, so dropping them from here silently stops both. */
    "იან": "Jan", "თებ": "Feb", "მარ": "Mar", "აპრ": "Apr", "მაი": "May", "ივნ": "Jun",
    "ივლ": "Jul", "აგვ": "Aug", "სექ": "Sep", "ოქტ": "Oct", "ნოე": "Nov", "დეკ": "Dec",
    "იანვარი": "January", "თებერვალი": "February", "მარტი": "March", "აპრილი": "April",
    "მაისი": "May", "ივნისი": "June", "ივლისი": "July", "აგვისტო": "August",
    "სექტემბერი": "September", "ოქტომბერი": "October", "ნოემბერი": "November",
    "დეკემბერი": "December",
    "GameJam 2025 — შემაჯამებელი": "GameJam 2025 — wrap-up",
    "შესწორების მოთხოვნა": "Request an edit",
    "GGC-ის საქმიანობა ოთხ ნაწილად იყოფა. აირჩიე მიმართულება — ქვემოთ სრული კონტენტი გამოჩნდება.":
      "GGC's work splits into four parts. Pick a direction — the full content appears below.",
    "ერთი თემა, ორი მოხსენება, ერთი საათი კითხვები. უფასო, დარეგისტრირების გარეშე.":
      "One topic, two talks, an hour of questions. Free, no registration.",
    "48 საათი, გუნდები ადგილზე იკრიბება, ბოლოს ყველა თამაშობს ერთმანეთის თამაშს.":
      "48 hours, teams form on site, and at the end everyone plays each other's games.",
    "პრაქტიკული სესია კონკრეტულ უნარზე — 2D, 3D, პროგრამირება, ბიზნესი.":
      "A hands-on session on one skill — 2D, 3D, programming, business.",
    "წლის შედეგები, ახალი თამაშების ჩვენება და ინდუსტრიის შეხვედრა.":
      "The year's results, new game showcases and an industry get-together.",
    "ივენთების გამოცხადება, ვაკანსიები, ერთმანეთის დახმარება და ის შუადღის კითხვები, რომლებზეც ფორუმზე ვერავინ გიპასუხებდა.":
      "Event announcements, job posts, mutual help, and the midday questions no forum would answer.",
    "კომუნითი და ივენთები": "Community and events",
    "დაწერე Telegram-ზე — ყველაზე სწრაფი გზაა.": "Write on Telegram — it's the fastest way.",
    "GGC არის ქართული თამაშების საზოგადოება — ადგილი, სადაც სტუდიები, გუნდები და ცალკეული დეველოპერები ერთმანეთს პოულობენ. ჩვენ არ ვქმნით თამაშებს; ჩვენ ვაშენებთ ინფრასტრუქტურას, რომელიც თამაშების შექმნას აადვილებს.":
      "GGC is the Georgian games community — the place where studios, teams and individual developers find each other. We don't make games; we build the infrastructure that makes making them easier.",

    /* ------------------------------------------------------------ cities */
    "თბილისი": "Tbilisi", "ბათუმი": "Batumi", "ქუთაისი": "Kutaisi", "რუსთავი": "Rustavi",
    "გორი": "Gori", "ზუგდიდი": "Zugdidi", "ფოთი": "Poti", "თელავი": "Telavi",
    "ახალციხე": "Akhaltsikhe", "ოზურგეთი": "Ozurgeti", "სხვა": "Other",
    "საზღვარგარეთ": "Abroad", "ონლაინ": "online",

    /* ------------------------------------------------------------ donate */
    "დაგვეხმარე, რომ ეს ყველაფერი გაგრძელდეს": "Help us keep this going",
    "GGC-ს არავინ აფინანსებს ისე, როგორც ჩვენ გვინდა. ჯემები, მითაფები და მასტერკლასები ჩვენივე დროით და მცირე ბიუჯეტით იდგამს ფეხს. ყოველი შემოწირულობა პირდაპირ იმაში მიდის, რაც კომუნითის თვალწინ ხდება.":
      "Nobody funds GGC the way we'd like. The jams, meetups and masterclasses run on our own time and a small budget. Every donation goes straight into what the community can see happening.",
    "შემოწირულობა Kisa.ge-ით": "Donate via Kisa.ge",
    "ერთჯერადად ან ყოველთვიურად, ბარათით. ერთი ღილაკი, ქართული პლატფორმა, ყველაფერი გამჭვირვალედ.":
      "One-off or monthly, by card. One button, a Georgian platform, everything transparent.",
    "დაასკანერე QR ტელეფონით": "Scan the QR with your phone",
    "ჯემის პრიზები": "Jam prizes", "სივრცე და ტექნიკა": "Venue and gear",
    "სტუდიები ექსპოებზე": "Studios at expos",
    "გეიმჯემები და პრიზები": "Game jams and prizes",
    "მითაფები და მასტერკლასები": "Meetups and masterclasses",
    "გეიმჯემი პრიზების გარეშე უბრალოდ შაბათ-კვირაა. პრიზი არის მიზეზი, რომ ხალხმა თამაში ბოლომდე მიიყვანოს.":
      "A game jam without prizes is just a weekend. The prize is the reason people finish the game.",
    "დარბაზი, პროექტორი, მიკროფონი, ინტერნეტი — მითაფი ამათ გარეშე არ დგება.":
      "A hall, a projector, a microphone, internet — a meetup doesn't happen without them.",
    "ერთი ბილეთი საერთაშორისო ექსპოზე ქართული სტუდიისთვის ხშირად პირველი რეალური კონტრაქტია.":
      "One ticket to an international expo is often a Georgian studio's first real contract.",
    "სად წავიდა შარშანდელი ფული": "Where last year's money went",
    "რიცხვები შეიცვლება რეალურით — სტრუქტურა ასეთი რჩება.":
      "The numbers will be replaced with real ones — the structure stays as it is.",
    "სულ": "Total", "მწვანე": "Green", "შავ-თეთრი": "Mono",
    "წითელი": "Red", "ლურჯი": "Blue", "ყვითელი": "Yellow",

    /* ------------------------------------------------------------- about */
    "GGC რიცხვებში": "GGC in numbers", "პარტნიორები": "Partners",
    "გზა 2022-დან დღემდე": "From 2022 to today",
    "საზოგადოება და ივენთები": "Community and events",
    "გამომცემლობა და პარტნიორობა": "Publishing and partnerships",
    "მონაცემები და კატალოგი": "Data and catalogue",
    "ფორმა →": "Form →",
    "თანადამფუძნებელი": "Co-founder",
    "პროექტების მენეჯერი": "Project manager", "კონტენტი": "Content",
    "GGC ქართული თამაშების საზოგადოებაა, სივრცე სადაც სტუდიები, გუნდები და სოლო დეველოპერები ერთმანეთს პოულობენ. ჩვენ თავად არ ვქმნით თამაშებს, მაგრამ ვქმნით გარემოს, რომელიც ამ პროცესს ბევრად მარტივს ხდის.":
      "GGC is the Georgian games community — the place where studios, teams and individual developers find each other. We don't make games ourselves; we build the environment that makes making them far easier.",
    "ადამიანი გადამზადებული 2023 წლიდან": "people trained since 2023",
    "ტექნოპარკის ჩართულობით": "with Technopark involvement",
    "გლობალური გეიმჯემი 2022-2026": "global game jams 2022-2026",
    "სტარტაპ ბიუროსთან პარტნიორობით": "in partnership with Startup Bureau",
    "მითაფი და 1 კონფერენცია": "meetups and 1 conference",
    "საშუალო დასწრება 130 კაცი": "average attendance 130 people",
    "კონსულტაცია სტუდიებთან": "consultations with studios",
    "მიმართულებები, გამოცდილება, მასშტაბი": "direction, experience, scale",
    "საერთაშორისო კომპანიის რელოკაცია": "international company relocated",
    "ესტონური აუთსორს-სტუდია": "an Estonian outsourcing studio",
    "კომპანიის ქსელი, 160 წევრი": "company network, 160 members",
    "Telegram, სოც მედია, პირდაპირი კავშირი": "Telegram, social media, direct contact",
    "დასაწყისი": "The start", "გადამზადება": "Training", "მასშტაბი": "Scale", "კატალოგი": "Catalogue",
    "პირველი ჯემი და პირველი მითაფები.": "The first jam and the first meetups.",
    "30+ ადამიანი, ტექნოპარკთან თანამშრომლობა.": "30+ people, working with Technopark.",
    "10 მითაფი, კონფერენცია, 70,000₾ ბიუჯეტი.": "10 meetups, a conference, a ₾70,000 budget.",
    "სტუდიებთან კონსულტაციები და პირველი პროექტები.": "Consultations with studios and the first projects.",
    "ღია მონაცემები ქართულ გეიმდევზე.": "Open data on Georgian gamedev.",
    "ლოგოებს ჩაანაცვლებ —": "Replace the logos —",
    "მოგვწერე Telegram-ზე, ეს ყველაზე სწრაფი გზაა.": "Write on Telegram — it's the fastest way.",
    "თამაშის პიჩი, ინვესტიცია, სპონსორობა.": "Game pitches, investment, sponsorship.",
    "შენი სტუდიის დამატება ან შესწორება.": "Add or correct your studio.",

    /* -------------------------------------------------------- wireframes */
    "საიტის სტრუქტურა და ვაირფრეიმები": "Site structure and wireframes",
    "დანარჩენი გვერდები": "The remaining pages",
    "კომპანიის პროფილი": "Company profile", "თამაშის გვერდი": "Game page",
    "ვერიფიც. კომპანიები": "verified companies", "ვერიფიც. გუნდები": "verified teams",
    "აქსელერაცია · მალე": "Acceleration · soon", "მონაცემები · მალე": "Report · soon",
    "ჩვენ შესახებ · About": "About", "ადამიანები · People": "People",
    "სიახლეები · News": "News", "კონტაქტი · Contact": "Contact"
  };
  var ATTRS = ["placeholder", "aria-label", "title"];

  /* Whole-node matching only. Composites (a word plus a number, a date, or a
     list the page builds at runtime) get narrow patterns — a general substring
     pass would splice English into untranslated Georgian sentences. */
  var PATTERNS = [
    [/^(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი) (\d{4})$/,
      function (m, a, b) { return (DICT[a] || a) + " " + b; }],
    [/^ვალიდაცია (.+)$/, function (m, a) { return "validated " + a; }],
    [/^მალე (\d{4})$/, function (m, a) { return "soon " + a; }],
    [/^(\d+) თამაში$/, function (m, a) { return a + " games"; }],
    [/^(\d+) ჩანაწერი$/, function (m, a) { return a + (a === "1" ? " entry" : " entries"); }],
    [/^(\d+) ველი$/, function (m, a) { return a + (a === "1" ? " field" : " fields"); }],
    [/^(\d+) მოთხოვნა$/, function (m, a) { return a + " submissions"; }],
    [/^მითაფი #(\d+) · (.+)$/, function (m, a, b) { return "Meetup #" + a + " · " + (DICT[b] || b); }],
    [/^მონაცემები ავტომატურად მოდის (.+?)-იდან(.*)$/, function (m, a, b) { return "Data comes automatically from " + a + b; }],
    /* Required fields are marked on the label itself and listed underneath, both
       assembled at runtime — so the label is translated without its star, and
       the list is translated one item at a time. */
    [/^(.+) \*$/, function (m, a) { return (DICT[a] || a) + " *"; }],
    [/^\* — სავალდებულო\. ყველა შევსებულია\.$/, function () { return "* — required. All filled in."; }],
    [/^\* — სავალდებულო\. შესავსებია: (.+)\.$/, function (m, a) {
      return "* — required. Still to fill in: " + a.split(/,\s*/).map(function (x) { return DICT[x] || x; }).join(", ") + ".";
    }],
    [/^შესავსებია: (.+)$/, function (m, a) {
      return "Still to fill in: " + a.split(/,\s*/).map(function (x) { return DICT[x] || x; }).join(", ");
    }],
    [/^(რეგისტრირებული კომპანია|გუნდი|სოლო დეველოპერი) — ნაჩვენებია სულ$/,
      function (m, a) { return (DICT[a] || a) + " — showing in total"; }],
    [/^დაემატა (\d+) თამაში(.*)$/, function (m, a, b) { return "Added " + a + " game" + (a === "1" ? "" : "s") + b; }]
  ];
  function tr(text) {
    var k = text.trim();
    if (DICT[k]) return text.replace(k, DICT[k]);
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i][0].test(k)) return text.replace(k, k.replace(PATTERNS[i][0], PATTERNS[i][1]));
    }
    return null;
  }
  var lang = "ka";
  try { lang = localStorage.getItem("ggc.lang") || "ka"; } catch (e) {}

  function walk(root) {
    if (lang !== "en") return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, hits = [];
    while ((n = w.nextNode())) {
      var t = n.nodeValue;
      if (!t.trim()) continue;
      if (n.parentNode && /SCRIPT|STYLE/.test(n.parentNode.nodeName)) continue;
      var next = tr(t);
      if (next && next !== t) hits.push([n, next]);
    }
    hits.forEach(function (h) { h[0].nodeValue = h[1]; });
    var els = root.querySelectorAll ? root.querySelectorAll("[placeholder],[aria-label],[title]") : [];
    for (var i = 0; i < els.length; i++) {
      for (var a = 0; a < ATTRS.length; a++) {
        var v = els[i].getAttribute(ATTRS[a]);
        if (!v) continue;
        var nv = tr(v);
        if (nv && nv !== v) els[i].setAttribute(ATTRS[a], nv);
      }
    }
  }
  function marks() {
    var b = document.querySelectorAll("[data-ggc-lang]");
    for (var i = 0; i < b.length; i++) {
      var on = b[i].getAttribute("data-ggc-lang") === lang;
      b[i].style.background = on ? "#16181b" : "transparent";
      b[i].style.color = on ? "#fff" : "#5a5f65";
    }
  }
  function run() { walk(document.body); marks(); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-ggc-lang]");
    if (!t) return;
    var next = t.getAttribute("data-ggc-lang");
    if (next === lang) return;
    try { localStorage.setItem("ggc.lang", next); } catch (er) {}
    location.reload();
  });

  /* A React re-render arrives as several mutation batches, not one. Waiting a
     single animation frame translated whichever batch had landed and left the
     rest in Georgian until something else happened to nudge the observer — a
     few hundred milliseconds of half-translated page after every step of the
     form. So a run is followed by a short second pass, which catches the tail.
     It cannot loop: a pass that changes nothing produces no mutations, and both
     timers coalesce. */
  var pending = null, trailing = null;
  function schedule() {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = null;
      run();
      if (trailing) clearTimeout(trailing);
      trailing = setTimeout(function () { trailing = null; run(); }, 90);
    });
  }
  new MutationObserver(schedule)
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  window.GGCI18n = { lang: lang, dict: DICT, apply: run };
})();
