/* GGC bilingual layer: Georgian is authored in the markup, English is applied on top.
   Add pairs here — key = exact Georgian text, value = English. */
(function () {
  var DICT = {
    // header / nav
    "ჰაბი": "Hub", "კომპანიები": "Companies", "თამაშები": "Games", "ჩვენ შესახებ": "About",
    "დონაცია": "Donate", "დამატება": "Submit", "მონაცემები": "Report", "რეპორტი": "Report",
    "საზოგადოება": "Community", "გამომცემლობა": "Publishing", "აქსელერაცია": "Acceleration",
    "მხარდაჭერა": "Support", "ადმინი": "Admin", "ქარ": "GE",
    // home
    "თამაშები იქმნება აქ": "Games are made here",
    "ვერიფიცირებული კომპანია და გუნდი": "verified companies and teams",
    "სოლო დეველოპერი": "solo developers", "სოლო დეველოპერები": "solo developers",
    "თამაში კატალოგში": "games in the catalogue",
    "ვერიფიცირებული სტუდია": "verified studios",
    "მოსალოდნელი გამოშვება": "upcoming releases",
    "ოთხი მიმართულება": "Four directions",
    "მალე განახლდება": "coming soon",
    "რა იგეგმება →": "what is planned →",
    "ნახე მონაცემები →": "see the report →",
    "დაამატე შენი სტუდია": "Add your studio",
    "დაამატე თამაში": "Add a game",
    "ყველა თამაში →": "All games →",
    "ყველა სტუდია →": "All studios →",
    // hub
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
    "სტუდიები ქალაქების მიხედვით": "Studios by city", "გუნდის ზომა": "Team size",
    "კატალოგში ნახვა →": "See in the catalogue →",
    "კოჰორტები": "Cohorts", "დაფინანსება": "Funding", "რელოკაცია": "Relocation",
    "მაინტერესებს — შემატყობინეთ": "I'm interested — notify me",
    "სანამ — გამომცემლობა": "Meanwhile — publishing",
    "თბილისი": "Tbilisi", "ბათუმი": "Batumi", "ქუთაისი": "Kutaisi", "სხვა": "Other",
    "ონლაინ": "online",
    // catalogue
    "ქართული სტუდიები": "Georgian studios", "ქართული თამაშები": "Georgian games",
    "რეგისტრირებული კომპანიები": "Registered companies", "გუნდები": "Teams",
    "რეგისტრირებული კომპანია": "Registered company", "გუნდი": "Team",
    "ყველა": "All", "მოსალოდნელი": "Upcoming", "გამოსული": "Released",
    "ყველა წელი": "All years", "ძებნა": "Search",
    "ძებნა სახელით ან ID-ით": "Search by name or ID",
    "ძებნა თამაშით ან სტუდიით": "Search by game or studio",
    "ვერაფერი მოიძებნა": "Nothing found",
    "აქტიური": "active", "არააქტიური": "inactive",
    "არააქტიურების ჩვენება": "show inactive",
    "ვერიფიცირებული": "verified",
    "თამაში": "games", "სტუდია": "studio",
    "ოფიციალური სახელი": "Legal name", "საიდენტიფიკაციო": "Registry ID",
    "ქალაქი": "City", "დაფუძნება": "Founded", "სტატუსი": "Status",
    "GGC ვალიდაცია": "GGC validation", "ვალიდაცია": "validated",
    "შესწორების მოთხოვნა": "Suggest an edit",
    "თამაში ჯერ არ არის მიმაგრებული": "No games attached yet",
    "გამოშვება": "Release", "ჟანრი": "Genre", "პლატფორმა": "Platforms",
    "ძრავი": "Engine", "ფასი": "Price", "ენები": "Languages",
    "დახურვა": "Close",
    // submit
    "მონაცემების გაგზავნა": "Submit data",
    "ქმედება": "Action", "იდენტიფიკაცია": "Identification", "დეტალები": "Details",
    "გადახედვა": "Review", "ცოცხალი გადახედვა": "Live preview",
    "ახალი სტუდიის დამატება": "Add a new studio",
    "თამაშის დამატება": "Add a game",
    "არსებული მონაცემის შესწორება": "Correct existing data",
    "იპოვე შენი სტუდია": "Find your studio",
    "ახლის შექმნა": "Create new",
    "ვერ მოიძებნა — შექმენი ახალი": "Not found — create it",
    "შემდეგი": "Next", "უკან": "Back", "გაგზავნა": "Send", "გაიგზავნა": "Sent",
    "კი, გვერდი მაქვს": "Yes, I have a store page",
    "არა, ხელით შევავსებ": "No, I'll fill it in",
    "წაკითხვა": "Read", "ხელახლა წაკითხვა": "Read again",
    "ვინ ხარ": "Who you are", "რას აკეთებთ": "What you do", "რას აკეთებ": "What you do",
    "ლინკები და სოციალური ქსელები": "Links and social media",
    "დრაფტი ინახება": "Draft saved",
    "კატალოგში დაბრუნება": "Back to the catalogue",
    "კიდევ ერთის დამატება": "Add another",
    "გაგზავნამდე": "Before you send",
    "ვალიდაციის მოლოდინში": "awaiting validation",
    "როლები არ არის მითითებული": "no roles set",
    // donate
    "შემოწირულობა Kisa.ge-ით": "Donate via Kisa.ge",
    "ჯემის პრიზები": "Jam prizes", "სივრცე და ტექნიკა": "Venue and gear",
    "სტუდიები ექსპოებზე": "Studios at expos",
    "სად წავიდა შარშანდელი ფული": "Where last year's money went",
    "სულ": "Total", "მწვანე": "Green", "შავ-თეთრი": "Mono",
    "დაასკანერე QR ტელეფონით": "Scan the QR with your phone",
    // about
    "GGC რიცხვებში": "GGC in numbers", "გუნდი": "Team", "პარტნიორები": "Partners",
    "გზა 2022-დან დღემდე": "From 2022 to today",
    "კომუნითი და ივენთები": "Community and events",
    "გამომცემლობა და პარტნიორობა": "Publishing and partnerships",
    "მონაცემები და კატალოგი": "Data and catalogue",
    "ფორმა →": "Form →",
    "თანადამფუძნებელი": "Co-founder",
    "პროექტების მენეჯერი": "Project manager", "კონტენტი": "Content",
    // hub body copy
    "GGC-ის საქმიანობა ოთხ ნაწილად იყოფა. აირჩიე მიმართულება — ქვემოთ სრული კონტენტი გამოჩნდება.":
      "GGC's work splits into four parts. Pick a direction — the full content appears below.",
    "მითაფები, ჯემები, მასტერკლასები": "Meetups, jams, masterclasses",
    "დაფინანსება, პორტინგი, გამოშვება": "Funding, porting, release",
    "ინკუბატორი და ზრდის პროგრამა": "Incubator and growth programme",
    "ინდუსტრიის მონაცემები რიცხვებში": "Industry data in numbers",
    "ერთი თემა, ორი მოხსენება, ერთი საათი კითხვები. უფასო, დარეგისტრირების გარეშე.":
      "One topic, two talks, an hour of questions. Free, no registration.",
    "48 საათი, გუნდები ადგილზე იკრიბება, ბოლოს ყველა თამაშობს ერთმანეთის თამაშს.":
      "48 hours, teams form on site, and everyone plays each other's games at the end.",
    "პრაქტიკული სესია კონკრეტულ უნარზე — 2D, 3D, პროგრამირება, ბიზნესი.":
      "A hands-on session on one skill — 2D, 3D, programming, business.",
    "წლის შედეგები, ახალი თამაშების ჩვენება და ინდუსტრიის შეხვედრა.":
      "The year's results, new game showcases and an industry get-together.",
    "ივენთების გამოცხადება, ვაკანსიები, ერთმანეთის დახმარება და ის შუადღის კითხვები, რომლებზეც ფორუმზე ვერავინ გიპასუხებდა.":
      "Event announcements, job posts, mutual help, and the midday questions no forum would answer.",
    "Facebook-ის გვერდიდან": "from the Facebook page",
    // calendar
    "თებ": "Feb", "მარ": "Mar", "აპრ": "Apr", "მაი": "May", "ივნ": "Jun",
    "ივლ": "Jul", "აგვ": "Aug", "სექ": "Sep", "ოქტ": "Oct", "ნოე": "Nov", "დეკ": "Dec", "იან": "Jan",
    "2D არტი თამაშებში": "2D art in games", "3D არტი თამაშებში": "3D art in games",
    "პროგრამირება თამაშებში": "Programming in games",
    "საერთაშორისო მითაფი": "International meetup",
    "მითაფი #1 · თბილისი": "Meetup #1 · Tbilisi",
    "მითაფი #2 · თბილისი": "Meetup #2 · Tbilisi",
    "მითაფი #3 · ონლაინ": "Meetup #3 · online",
    "48 საათი · ტექნოპარკი": "48 hours · Technopark",
    "სტუმრები საზღვარგარეთიდან": "Guests from abroad",
    "წლის შედეგები": "The year in review",
    // past events
    "GameJam 2025 — შემაჯამებელი": "GameJam 2025 — wrap-up",
    "მითაფი: 2D არტი თამაშებში": "Meetup: 2D art in games",
    "მასტერკლასი: Unity-ს ოპტიმიზაცია": "Masterclass: Unity optimisation",
    "GGC კონფერენცია": "GGC conference",
    "იანვარი": "January", "თებერვალი": "February", "მარტი": "March", "აპრილი": "April",
    "მაისი": "May", "ივნისი": "June", "ივლისი": "July", "აგვისტო": "August",
    "სექტემბერი": "September", "ოქტომბერი": "October", "ნოემბერი": "November", "დეკემბერი": "December",
    // publishing tab
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
      "You can invest in a specific game or in a studio. Write to us and we'll send a short overview of the projects.",
    "თუ ეძებ, სად შედის ფული ქართულ გეიმდევში — ეს გვერდი საწყისი წერტილია. სრული პორტფელი, ეტაპები და გუნდები მოთხოვნისთანავე.":
      "If you're looking for where money goes in Georgian gamedev, this page is the starting point. Full portfolio, milestones and teams on request.",
    // acceleration tab
    "ინკუბატორი და აქსელერატორი ქართული სტუდიებისთვის, რომლებიც უკვე მზად არიან გაზრდისთვის. პროგრამა ჯერ იწერება — ქვემოთ ის მიმართულებებია, რომლებზეც ვმუშაობთ.":
      "An incubator and accelerator for Georgian studios that are ready to grow. The programme is still being written — below are the directions we're working on.",
    "3-6 სტუდია ერთ ნაკადში, ფიქსირებული ხანგრძლივობა და ეტაპები.":
      "3-6 studios per cohort, with a fixed length and milestones.",
    "გრანტი ან თანადაფინანსება კონკრეტულ ეტაპზე, გამჭვირვალე პირობებით.":
      "A grant or co-funding at a specific stage, on transparent terms.",
    "უცხოური სტუდიების საქართველოში გადმოსვლის მხარდაჭერა.":
      "Support for foreign studios relocating to Georgia.",
    // report tab
    "ქართული გეიმდევი 2025": "Georgian gamedev 2025",
    "ქართული გეიმდევი 2024": "Georgian gamedev 2024",
    "სტუდიების გამოკითხვა 2024": "Studio survey 2024",
    "PDF · მალე": "PDF · soon",
    "სტუდიის სახელი": "Studio name", "თამაშის სახელი": "Game title",
    "მობაილ თამაში": "Mobile game", "სახელი გვარი": "Name Surname",
    // about page
    "GGC არის ქართული თამაშების საზოგადოება — ადგილი, სადაც სტუდიები, გუნდები და ცალკეული დეველოპერები ერთმანეთს პოულობენ. ჩვენ არ ვქმნით თამაშებს; ჩვენ ვაშენებთ ინფრასტრუქტურას, რომელიც თამაშების შექმნას აადვილებს.":
      "GGC is the Georgian games community — the place where studios, teams and individual developers find each other. We don't make games; we build the infrastructure that makes making them easier.",
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
    "ლოგოებს ჩაანაცვლებ — ": "Replace the logos — ",
    "დაწერე Telegram-ზე — ყველაზე სწრაფი გზაა.": "Write on Telegram — it's the fastest way.",
    "თამაშის პიჩი, ინვესტიცია, სპონსორობა.": "Game pitches, investment, sponsorship.",
    "შენი სტუდიის დამატება ან შესწორება.": "Add or correct your studio.",
    // live data — catalogue fields
    "საჯარო სახელი": "Public name", "აღწერა": "About", "გამომცემელი": "Publisher",
    "აღწერა (English)": "About (English)", "საკონტაქტო პირი და კავშირი": "Contact person and handle",
    "დაფუძნების წელი": "Founded", "თამაშის სახელი": "Game title",
    "პლატფორმა": "Platform", "ჟანრი": "Genre",
    "მონაცემები შევსებულია ხელით": "Filled in by hand",
    "თამაში ჯერ არ არის მიმაგრებული": "No games attached yet",
    "ვალიდაციის მოლოდინში": "Awaiting validation",
    "მოსალოდნელი": "Upcoming", "გამოსული": "Released",
    "ვერიფიცირებული სტუდია": "verified studios",
    // submit — delivery step
    "თითქმის მზადაა": "Almost there",
    "დაასრულე გაგზავნა": "Finish sending",
    "აირჩიე ერთი გზა — ორივე ერთსა და იმავე ადგილას მოდის.": "Pick either one — they both reach the same place.",
    "ფორმა შევსებულია. დარჩა ერთი ღილაკი — აირჩიე, როგორ მოგვაწოდო, და ჩვენ გადავამოწმებთ.":
      "The form is filled in. One button left — pick how to send it and we'll review it.",
    "GitHub-ით გაგზავნა ↗": "Send via GitHub ↗",
    "JSON-ის კოპირება": "Copy the JSON", "დაკოპირდა ✔": "Copied ✔",
    "ჩასვი მაღაზიის ბმული": "Paste the store link",
    "იკითხება…": "reading…", "წაკითხვა": "Read", "ხელახლა წაკითხვა": "Read again",
    "ავტომატურად ვერ წავიკითხეთ — შეავსე ხელით, ბმულს ჩვენ თვითონ დავამუშავებთ":
      "Couldn't read it automatically — fill it in by hand, we'll process the link ourselves",
    "ამ გვერდიდან მონაცემები ვერ წაიკითხა": "Nothing could be read from that page",
    "პასუხი JSON არ არის": "The response is not JSON",
    "ცარიელი ბმული": "Empty link"
  };
  var ATTRS = ["placeholder", "aria-label", "title"];
  // Whole-node matching only. Composites (word + number/date) get narrow patterns —
  // a general substring pass would splice English into untranslated Georgian sentences.
  var PATTERNS = [
    [/^(\u10d8\u10d0\u10dc\u10d5\u10d0\u10e0\u10d8|\u10d7\u10d4\u10d1\u10d4\u10e0\u10d5\u10d0\u10da\u10d8|\u10db\u10d0\u10e0\u10e2\u10d8|\u10d0\u10de\u10e0\u10d8\u10da\u10d8|\u10db\u10d0\u10d8\u10e1\u10d8|\u10d8\u10d5\u10dc\u10d8\u10e1\u10d8|\u10d8\u10d5\u10da\u10d8\u10e1\u10d8|\u10d0\u10d2\u10d5\u10d8\u10e1\u10e2\u10dd|\u10e1\u10d4\u10e5\u10e2\u10d4\u10db\u10d1\u10d4\u10e0\u10d8|\u10dd\u10e5\u10e2\u10dd\u10db\u10d1\u10d4\u10e0\u10d8|\u10dc\u10dd\u10d4\u10db\u10d1\u10d4\u10e0\u10d8|\u10d3\u10d4\u10d9\u10d4\u10db\u10d1\u10d4\u10e0\u10d8) (\d{4})$/, function (m, a, b) { return (DICT[a] || a) + " " + b; }],
    [/^\u10d5\u10d0\u10da\u10d8\u10d3\u10d0\u10ea\u10d8\u10d0 (.+)$/, function (m, a) { return "validated " + a; }],
    [/^\u10db\u10d0\u10da\u10d4 (\d{4})$/, function (m, a) { return "soon " + a; }],
    [/^(\d+) \u10d7\u10d0\u10db\u10d0\u10e8\u10d8$/, function (m, a) { return a + " games"; }],
    [/^\u10db\u10d8\u10d7\u10d0\u10e4\u10d8 #(\d+) \u00b7 (.+)$/, function (m, a, b) { return "Meetup #" + a + " \u00b7 " + (DICT[b] || b); }],
    // "\u10db\u10dd\u10dc\u10d0\u10ea\u10d4\u10db\u10d4\u10d1\u10d8 \u10d0\u10d5\u10e2\u10dd\u10db\u10d0\u10e2\u10e3\u10e0\u10d0\u10d3 \u10db\u10dd\u10d3\u10d8\u10e1 Steam-\u10d8\u10d3\u10d0\u10dc \u00b7 12.03.2026"
    [/^\u10db\u10dd\u10dc\u10d0\u10ea\u10d4\u10db\u10d4\u10d1\u10d8 \u10d0\u10d5\u10e2\u10dd\u10db\u10d0\u10e2\u10e3\u10e0\u10d0\u10d3 \u10db\u10dd\u10d3\u10d8\u10e1 (.+?)-\u10d8\u10d3\u10d0\u10dc(.*)$/, function (m, a, b) { return "Data comes automatically from " + a + b; }],
    // "\u10d5\u10d0\u10da\u10d8\u10d3\u10d0\u10ea\u10d8\u10d0 12.03.2026" already handled above; this covers the counter row
    [/^(\d+) \u10db\u10dd\u10d7\u10ee\u10dd\u10d5\u10dc\u10d0$/, function (m, a) { return a + " submissions"; }]
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

  var pending = null;
  new MutationObserver(function () {
    if (pending) return;
    pending = requestAnimationFrame(function () { pending = null; run(); });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  window.GGCI18n = { lang: lang, dict: DICT, apply: run };
})();
