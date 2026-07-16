// Curated country → cities dataset for the registration cascade dropdowns.
// Bundled (no external API) so it works offline and doesn't depend on the
// network. India is covered in the most depth; other major countries include
// their principal cities. Not exhaustive — enough for the sign-up flow.

export const COUNTRY_CITIES = {
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast"],
  Bangladesh: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet"],
  Brazil: ["São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte", "Porto Alegre", "Curitiba"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Waterloo"],
  China: ["Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Hangzhou", "Chengdu"],
  Egypt: ["Cairo", "Alexandria", "Giza"],
  France: ["Paris", "Lyon", "Marseille", "Toulouse", "Lille", "Bordeaux", "Nice"],
  Germany: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Stuttgart", "Düsseldorf"],
  India: [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
    "Ahmedabad", "Gurugram", "Noida", "Jaipur", "Chandigarh", "Kochi", "Coimbatore",
    "Indore", "Lucknow", "Nagpur", "Bhubaneswar", "Visakhapatnam", "Surat",
    "Thiruvananthapuram", "Mysuru", "Mohali", "Vadodara", "Nashik",
  ],
  Indonesia: ["Jakarta", "Surabaya", "Bandung", "Medan", "Bali (Denpasar)"],
  Ireland: ["Dublin", "Cork", "Galway", "Limerick"],
  Israel: ["Tel Aviv", "Jerusalem", "Haifa"],
  Italy: ["Rome", "Milan", "Turin", "Naples", "Bologna", "Florence"],
  Japan: ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Fukuoka", "Kyoto"],
  Kenya: ["Nairobi", "Mombasa", "Kisumu"],
  Malaysia: ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh"],
  Mexico: ["Mexico City", "Guadalajara", "Monterrey", "Puebla"],
  Netherlands: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  "New Zealand": ["Auckland", "Wellington", "Christchurch", "Hamilton"],
  Nigeria: ["Lagos", "Abuja", "Port Harcourt", "Ibadan"],
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"],
  Philippines: ["Manila", "Cebu City", "Davao City", "Quezon City"],
  Poland: ["Warsaw", "Kraków", "Wrocław", "Gdańsk", "Poznań"],
  Qatar: ["Doha", "Al Rayyan"],
  Russia: ["Moscow", "Saint Petersburg", "Novosibirsk", "Kazan"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Mecca"],
  Singapore: ["Singapore"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu"],
  Spain: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
  "Sri Lanka": ["Colombo", "Kandy", "Galle"],
  Sweden: ["Stockholm", "Gothenburg", "Malmö"],
  Switzerland: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
  Thailand: ["Bangkok", "Chiang Mai", "Phuket"],
  Turkey: ["Istanbul", "Ankara", "Izmir", "Bursa"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  Ukraine: ["Kyiv", "Lviv", "Kharkiv", "Odesa"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Leeds", "Bristol", "Cambridge"],
  "United States": [
    "New York", "San Francisco", "Los Angeles", "Seattle", "Austin", "Boston",
    "Chicago", "Dallas", "Atlanta", "Denver", "Washington, D.C.", "San Jose",
    "Miami", "Houston", "Raleigh", "Portland",
  ],
  Vietnam: ["Ho Chi Minh City", "Hanoi", "Da Nang"],
};

// Sorted country names for the first dropdown.
export const COUNTRIES = Object.keys(COUNTRY_CITIES).sort((a, b) => a.localeCompare(b));

export function citiesOf(country) {
  return COUNTRY_CITIES[country] || [];
}
