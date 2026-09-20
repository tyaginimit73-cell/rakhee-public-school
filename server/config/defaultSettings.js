// Default website content — every value is editable from Admin → Website Settings.
// Contact details below are clearly-marked placeholders, not official school information.
export const defaultSettings = {
  site: {
    schoolName: 'Rakhee Public School',
    tagline: 'Inspiring Young Minds. Building Bright Futures.',
    address: 'SohanJani Tagan, Muzaffarnagar, Uttar Pradesh, India',
    phone: '+91 00000 00000',            // placeholder — update in Admin Settings
    email: 'info@rakheepublicschool.in', // placeholder — update in Admin Settings
    establishedYear: '—',
    affiliation: 'Affiliation details — update in Settings',
    board: 'Board details — update in Settings',
    hours: 'Mon–Sat · 8:00 AM – 2:30 PM',
  },
  announcement: '📢 Admissions open for the new session — apply online today! Limited seats.',
  admissionOpen: true,
  hero: {
    headline: 'Inspiring Young Minds. Building Bright Futures.',
    subtext: 'At Rakhee Public School, SohanJani Tagan (Muzaffarnagar), we blend strong academics with character, creativity and care — so every child grows confident, curious and future-ready.',
    image: '/images/hero-campus.jpg',
  },
  stats: [
    { label: 'Years of Excellence', value: 15, suffix: '+' },
    { label: 'Students', value: 1200, suffix: '+' },
    { label: 'Qualified Teachers', value: 45, suffix: '+' },
    { label: 'Academic Achievements', value: 98, suffix: '%' },
    { label: 'Activities & Programs', value: 30, suffix: '+' },
  ],
  about: {
    intro: 'Rakhee Public School, located in SohanJani Tagan, Muzaffarnagar, is a centre of learning committed to academic excellence and all-round development. We believe every child deserves a safe, joyful and disciplined environment where talent is nurtured and character is built.',
    vision: 'To nurture confident, compassionate and capable young citizens who lead with knowledge, integrity and imagination.',
    mission: 'To provide high-quality, value-based education through dedicated teachers, modern methods and a caring community — empowering every student to achieve their highest potential.',
    values: ['Excellence', 'Discipline', 'Integrity', 'Respect', 'Curiosity', 'Service'],
  },
  principal: {
    name: 'Mrs. Ananya Sharma', // demo data — editable in Settings
    designation: 'Principal',
    photo: '/images/principal.jpg',
    message: 'Dear parents and students, welcome to Rakhee Public School. Education, for us, is not merely the pursuit of marks but the shaping of minds and hearts. Our devoted faculty, safe campus and activity-rich curriculum ensure that every child discovers their strengths and learns to use them with purpose. I invite you to visit us and experience the warmth of our school family.',
  },
  social: {
    facebook: '#',  // placeholder — update in Settings
    instagram: '#', // placeholder
    youtube: '#',   // placeholder
  },
  // Facilities & activities matrix (source: public school listing) — editable in Admin → Settings
  facilities: [
    {
      group: 'Interests',
      items: [
        { label: 'Hobby Classes', available: false },
        { label: 'Debate & Discussions', available: true },
        { label: 'Educational Tours', available: true },
        { label: 'Write-ups for Magazine', available: false },
        { label: 'Creative Writing', available: false },
        { label: 'Orientation Programme', available: false },
        { label: 'Drama', available: false },
        { label: 'Fancy Dress', available: false },
        { label: 'Story-Telling Sessions', available: false },
        { label: 'Cooking Classes', available: false },
      ],
    },
    {
      group: 'Events',
      items: [
        { label: 'Parenting Seminars', available: false },
        { label: 'School Exhibition', available: false },
        { label: 'Seminars', available: false },
        { label: 'Sports Day', available: true },
        { label: 'Summer Camp', available: true },
        { label: 'Annual Day / Fest', available: true },
        { label: 'Art & Craft', available: true },
        { label: 'Scouts & Guides', available: true },
        { label: 'Science Exhibition', available: true },
        { label: 'Festival Celebrations', available: true },
        { label: 'Youth Parliament', available: false },
        { label: 'Workshops', available: false },
        { label: 'Christmas Carnival', available: true },
        { label: 'Blood Donation Camp', available: false },
      ],
    },
    {
      group: 'Competitions',
      items: [
        { label: 'Recitation Competition', available: false },
        { label: 'Quiz Competition', available: true },
        { label: 'Declamation Contest', available: false },
        { label: 'Handwriting Competition', available: false },
        { label: 'Wall Magazine Competition', available: false },
        { label: 'Spelling Bee Competition', available: false },
        { label: 'Calligraphy', available: false },
        { label: 'Music Competition', available: true },
        { label: 'Olympiad', available: false },
        { label: 'Drawing Competition', available: false },
        { label: 'Story Writing Competition', available: false },
        { label: 'Spelling Competition', available: false },
        { label: 'Dancing Competition', available: true },
      ],
    },
    {
      group: 'Sport & Fitness',
      items: [
        { label: 'Indoor Games', available: false },
        { label: 'Yoga Activity', available: true },
        { label: 'Swimming Pool', available: false },
        { label: 'Extra-Curricular Activities', available: true },
        { label: 'Sports', available: true },
        { label: 'Aerobics', available: false },
      ],
    },
    {
      group: 'Infrastructure',
      items: [
        { label: 'Hostel', available: true },
        { label: 'Kindergarten', available: false },
        { label: 'Music Rooms', available: false },
        { label: 'Symposium', available: false },
        { label: 'Toilet Facilities', available: true },
        { label: 'Auditorium', available: false },
        { label: 'Classrooms', available: true },
        { label: 'Dance Rooms', available: false },
        { label: 'IT Infrastructure', available: true },
        { label: 'Library', available: true },
        { label: 'Drinking Water', available: true },
        { label: 'Gymnasium', available: false },
        { label: 'Sports Academy', available: false },
        { label: 'Transport', available: false },
        { label: 'Cafeteria', available: false },
        { label: 'Convenience Store', available: false },
        { label: 'Blackboards in Classrooms', available: true },
      ],
    },
    {
      group: 'Advanced Facilities',
      items: [
        { label: 'Labs', available: true },
        { label: 'Security / CCTV', available: true },
        { label: 'Transfer Facility', available: false },
        { label: 'Medical Facility', available: true },
        { label: 'Health & Medical Check-up', available: true },
        { label: 'Cultural Exchange Programme', available: false },
      ],
    },
  ],
  feesNote: 'Fee amounts shown are illustrative. Please contact the school office for the official fee structure.',
};
