export async function initDB(sql: ReturnType<typeof import("@neondatabase/serverless").neon>) {
  await sql`CREATE TABLE IF NOT EXISTS packages (id TEXT PRIMARY KEY,name TEXT NOT NULL,destination TEXT,duration TEXT,price INTEGER,original_price INTEGER,image TEXT,description TEXT,highlights TEXT DEFAULT '[]',itinerary TEXT DEFAULT '[]',inclusions TEXT DEFAULT '[]',category TEXT DEFAULT 'spiritual',hidden BOOLEAN DEFAULT false,created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT,email TEXT,package_id TEXT,travelers INTEGER DEFAULT 1,travel_date TEXT,message TEXT,status TEXT DEFAULT 'new',created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT,email TEXT,city TEXT,package_id TEXT,package_name TEXT,travelers INTEGER DEFAULT 1,travel_date TEXT,amount INTEGER,payment_status TEXT DEFAULT 'pending',booking_status TEXT DEFAULT 'pending',created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY,name TEXT NOT NULL,rating INTEGER,text TEXT,city TEXT,package_name TEXT,active BOOLEAN DEFAULT true,created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS gallery (id TEXT PRIMARY KEY,src TEXT NOT NULL,caption TEXT,category TEXT,active BOOLEAN DEFAULT true,created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS blogs (id TEXT PRIMARY KEY,title TEXT NOT NULL,excerpt TEXT,content TEXT,image TEXT,category TEXT,author TEXT,active BOOLEAN DEFAULT true,created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY,question TEXT NOT NULL,question_hi TEXT,answer TEXT NOT NULL,answer_hi TEXT,active BOOLEAN DEFAULT true,sort_order INTEGER DEFAULT 0,created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,discount INTEGER,code TEXT,valid_from TEXT,valid_to TEXT,active BOOLEAN DEFAULT true,created_at TEXT)`;
}
