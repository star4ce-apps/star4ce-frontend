'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerApi, saveSession } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<'corporate' | 'manager' | 'admin' | ''>('');
  const [company, setCompany] = useState('');
  const [companyType, setCompanyType] = useState<'select' | 'other'>('select');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cityOther, setCityOther] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDifferenceModal, setShowDifferenceModal] = useState(false);

  const totalSteps = 3;

  // Known dealerships list
  const knownDealerships = [
    'ABC Auto Group',
    'Premier Motors',
    'Elite Automotive',
    'Metro Car Dealers',
    'Coastal Auto Group',
    'Mountain View Motors',
    'Sunset Dealership',
    'Riverside Automotive',
    'Valley Motors',
    'City Center Auto',
  ];

  // US States
  const usStates = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
  ];

  // Major cities by state (for dropdown/autocomplete)
  const citiesByState: { [key: string]: string[] } = {
    'CA': ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard', 'Moreno Valley', 'Huntington Beach', 'Glendale', 'Santa Clarita', 'Garden Grove', 'Oceanside', 'Rancho Cucamonga', 'Santa Rosa', 'Ontario', 'Lancaster', 'Elk Grove', 'Corona', 'Palmdale', 'Salinas', 'Pomona', 'Hayward', 'Escondido', 'Torrance', 'Sunnyvale', 'Orange', 'Fullerton', 'Pasadena', 'Thousand Oaks', 'Visalia', 'Simi Valley', 'Concord', 'Roseville', 'Vallejo', 'Victorville', 'Fairfield', 'Inglewood'],
    'MI': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint', 'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills', 'Kalamazoo', 'Wyoming', 'Southfield', 'Rochester Hills', 'Taylor', 'Pontiac', 'St. Clair Shores', 'Royal Oak', 'Novi', 'Dearborn Heights', 'Battle Creek', 'Saginaw', 'Kentwood', 'East Lansing', 'Roseville', 'Portage', 'Midland', 'Lincoln Park'],
    'NV': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko', 'Mesquite', 'Boulder City', 'Fallon', 'Winnemucca', 'West Wendover', 'Ely', 'Yerington'],
    'TX': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Garland', 'Irving', 'Amarillo', 'Grand Prairie', 'Brownsville', 'McKinney', 'Frisco', 'Pasadena', 'Killeen', 'McAllen', 'Carrollton', 'Midland', 'Denton', 'Abilene', 'Beaumont', 'Round Rock', 'Odessa', 'Waco', 'Richardson'],
    'FL': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral', 'Pembroke Pines', 'Hollywood', 'Miramar', 'Gainesville', 'Coral Springs', 'Miami Gardens', 'Clearwater', 'Palm Bay', 'West Palm Beach', 'Pompano Beach'],
    'NY': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'White Plains', 'Hempstead', 'Troy', 'Niagara Falls', 'Binghamton', 'Freeport', 'Valley Stream'],
    'IL': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Elgin', 'Peoria', 'Champaign', 'Waukegan', 'Cicero', 'Bloomington', 'Arlington Heights', 'Evanston', 'Decatur', 'Schaumburg', 'Bolingbrook', 'Palatine', 'Skokie', 'Des Plaines'],
    'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Altoona', 'York', 'State College', 'Wilkes-Barre', 'Chester', 'Williamsport'],
    'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield', 'Kettering', 'Elyria', 'Lakewood'],
    'GA': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Macon', 'Johns Creek', 'Albany', 'Warner Robins', 'Alpharetta', 'Marietta', 'Valdosta', 'Smyrna'],
    'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord', 'Asheville', 'Gastonia', 'Jacksonville', 'Chapel Hill', 'Rocky Mount'],
    'NJ': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Camden', 'Brick', 'Cherry Hill', 'Passaic'],
    'VA': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Portsmouth', 'Suffolk', 'Roanoke', 'Lynchburg', 'Harrisonburg', 'Leesburg', 'Charlottesville', 'Danville'],
    'WA': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton', 'Yakima', 'Federal Way', 'Spokane Valley', 'Bellingham', 'Kennewick', 'Auburn', 'Pasco'],
    'MA': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford', 'Brockton', 'Quincy', 'Lynn', 'Fall River', 'Newton', 'Lawrence', 'Somerville', 'Framingham', 'Haverhill'],
    'AZ': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale', 'Goodyear', 'Flagstaff', 'Buckeye'],
    'IN': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington', 'Hammond', 'Gary', 'Muncie', 'Terre Haute', 'Kokomo', 'Anderson', 'Noblesville', 'Greenwood'],
    'TN': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Jackson', 'Johnson City', 'Bartlett', 'Hendersonville', 'Kingsport', 'Collierville', 'Smyrna', 'Brentwood'],
    'MO': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'St. Peters', 'Blue Springs', 'Florissant', 'Joplin', 'Chesterfield', 'Jefferson City'],
    'MD': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Annapolis', 'College Park', 'Salisbury', 'Laurel', 'Greenbelt', 'Cumberland', 'Westminster', 'Elkton', 'Hyattsville', 'Takoma Park'],
    'WI': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Oshkosh', 'Eau Claire', 'Janesville', 'West Allis', 'La Crosse', 'Sheboygan', 'Wauwatosa', 'Fond du Lac'],
    'CO': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Greeley', 'Centennial', 'Boulder', 'Longmont', 'Loveland', 'Grand Junction'],
    'MN': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'St. Cloud', 'Eagan', 'Woodbury', 'Maple Grove', 'Eden Prairie', 'Coon Rapids', 'Burnsville', 'Minnetonka'],
    'SC': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Sumter', 'Hilton Head Island', 'Spartanburg', 'Florence', 'Aiken', 'Myrtle Beach', 'Anderson', 'Greer'],
    'AL': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison', 'Florence', 'Gadsden', 'Vestavia Hills', 'Prattville', 'Phenix City'],
    'LA': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma', 'Marlero', 'Central', 'Laplace', 'Prairieville', 'Terrytown'],
    'KY': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Hopkinsville', 'Richmond', 'Florence', 'Georgetown', 'Henderson', 'Elizabethtown', 'Nicholasville', 'Jeffersontown', 'Frankfort', 'Paducah'],
    'OR': ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro', 'Bend', 'Beaverton', 'Medford', 'Springfield', 'Corvallis', 'Albany', 'Tigard', 'Lake Oswego', 'Keizer', 'Grants Pass'],
    'OK': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton', 'Edmond', 'Moore', 'Midwest City', 'Enid', 'Stillwater', 'Muskogee', 'Bartlesville', 'Owasso', 'Shawnee', 'Ponca City'],
    'CT': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'West Hartford', 'Greenwich', 'Hamden', 'Fairfield', 'Manchester', 'West Haven', 'Milford'],
    'UT': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'Ogden', 'St. George', 'Layton', 'Taylorsville', 'South Jordan', 'Lehi', 'Logan', 'Murray', 'Draper'],
    'IA': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Council Bluffs', 'Ames', 'West Des Moines', 'Dubuque', 'Ankeny', 'Urbandale', 'Cedar Falls', 'Marion', 'Bettendorf'],
    'AR': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'North Little Rock', 'Conway', 'Rogers', 'Pine Bluff', 'Bentonville', 'Hot Springs', 'Texarkana', 'Sherwood', 'Jacksonville', 'Russellville'],
    'MS': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Greenville', 'Olive Branch', 'Horn Lake', 'Madison', 'Starkville', 'Oxford', 'Clinton', 'Ridgeland'],
    'KS': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Manhattan', 'Lenexa', 'Salina', 'Hutchinson', 'Leavenworth', 'Leawood', 'Dodge City', 'Garden City'],
    'NM': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs', 'Alamogordo', 'Carlsbad', 'Gallup', 'Deming', 'Los Lunas', 'Chaparral', 'Sunland Park'],
    'NE': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'North Platte', 'Norfolk', 'Columbus', 'Papillion', 'La Vista', 'Scottsbluff', 'South Sioux City', 'Beatrice'],
    'WV': ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown', 'Wheeling', 'Martinsburg', 'Fairmont', 'Beckley', 'Clarksburg', 'South Charleston', 'St. Albans', 'Vienna', 'Hurricane', 'Bridgeport', 'Keyser'],
    'ID': ['Boise', 'Nampa', 'Meridian', 'Idaho Falls', 'Pocatello', 'Caldwell', 'Coeur d\'Alene', 'Twin Falls', 'Lewiston', 'Post Falls', 'Rexburg', 'Chubbuck', 'Moscow', 'Eagle', 'Kuna'],
    'HI': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Kaneohe', 'Waipahu', 'Kahului', 'Ewa Gentry', 'Mililani Town', 'Kihei', 'Makakilo', 'Kapaa', 'Royal Kunia', 'Schofield Barracks', 'Kailua-Kona'],
    'NH': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Dover', 'Salem', 'Merrimack', 'Londonderry', 'Hudson', 'Bedford', 'Keene', 'Portsmouth', 'Goffstown', 'Laconia'],
    'ME': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Saco', 'Augusta', 'Westbrook', 'Waterville', 'Presque Isle', 'Caribou', 'Ellsworth', 'Old Orchard Beach'],
    'RI': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Newport', 'Central Falls', 'Westerly', 'Cumberland', 'North Providence', 'South Kingstown', 'Barrington', 'Middletown', 'Portsmouth'],
    'MT': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre', 'Anaconda', 'Miles City', 'Belgrade', 'Livingston', 'Laurel', 'Sidney', 'Glendive'],
    'DE': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown', 'Elsmere', 'New Castle', 'Laurel', 'Harrington', 'Camden', 'Clayton', 'Lewes'],
    'SD': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Watertown', 'Brookings', 'Mitchell', 'Yankton', 'Pierre', 'Huron', 'Vermillion', 'Spearfish', 'Madison', 'Sturgis', 'Belle Fourche', 'Hot Springs'],
    'ND': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan', 'Jamestown', 'Wahpeton', 'Devils Lake', 'Valley City', 'Grafton', 'Beulah', 'Watford City'],
    'AK': ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla', 'Sitka', 'Ketchikan', 'Kenai', 'Kodiak', 'Bethel', 'Palmer', 'Homer', 'Barrow', 'Unalaska', 'Valdez', 'Nome'],
    'VT': ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland', 'Montpelier', 'Barre', 'St. Albans', 'Winooski', 'Brattleboro', 'Milton', 'Hartford', 'Williston', 'Middlebury', 'Springfield'],
    'WY': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston', 'Riverton', 'Jackson', 'Cody', 'Rawlins', 'Lander', 'Torrington', 'Douglas'],
  };

  // Get cities for selected state (sorted alphabetically)
  const getCitiesForState = (stateCode: string): string[] => {
    const cities = citiesByState[stateCode] || [];
    return [...cities].sort();
  };

  function nextStep() {
    // If on step 1 and role is selected, redirect to appropriate registration page
    if (currentStep === 1 && role) {
      if (role === 'manager') {
        router.push('/manager-register');
        return;
      } else if (role === 'corporate') {
        router.push('/corporate-register');
        return;
      } else if (role === 'admin') {
        router.push('/admin-register');
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate confirm password
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Backend only uses email/password today; keep sending other fields for future use
      const data = await registerApi(email, password, role);
      // Don't save session - user must verify email first
      // Backend doesn't return a token until verified
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  // Prevent body scrolling when registration page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="fixed flex items-center justify-center overflow-hidden"
      style={{
        top: '110px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm z-0"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Register Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[95vh]">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex max-h-[95vh] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div 
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-6 md:p-8 flex flex-col justify-center overflow-hidden max-h-[95vh]">
            {/* Logo and Tagline */}
            <div className="text-center mb-4">
              <Link href="/" className="inline-block">
                <Logo size="lg" className="justify-center mb-4" />
              </Link>
              <p className="text-gray-700 text-base font-medium">
                Start your Star4ce trial.
              </p>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={currentStep === totalSteps ? onSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-5">
              {/* Step 1: Role Selection */}
              {currentStep === 1 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-gray-700 font-medium">
                        Select your account type
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDifferenceModal(true)}
                        className="text-sm text-[#0B2E65] hover:text-[#2c5aa0] hover:underline font-medium"
                      >
                        What's the difference?
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole('corporate')}
                        className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${
                          role === 'corporate'
                            ? 'border-[#0B2E65] bg-[#0B2E65]/10'
                            : 'border-gray-300 hover:border-[#0B2E65]/50'
                        }`}
                      >
                        <div className={`font-semibold text-xl mb-2 ${role === 'corporate' ? 'text-[#0B2E65]' : 'text-gray-700'}`}>
                          Corporate
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Oversee all your dealerships</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('manager')}
                        className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${
                          role === 'manager'
                            ? 'border-[#0B2E65] bg-[#0B2E65]/10'
                            : 'border-gray-300 hover:border-[#0B2E65]/50'
                        }`}
                      >
                        <div className={`font-semibold text-xl mb-2 ${role === 'manager' ? 'text-[#0B2E65]' : 'text-gray-700'}`}>
                          Manager
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Sub-managers of a dealership</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${
                          role === 'admin'
                            ? 'border-[#0B2E65] bg-[#0B2E65]/10'
                            : 'border-gray-300 hover:border-[#0B2E65]/50'
                        }`}
                      >
                        <div className={`font-semibold text-xl mb-2 ${role === 'admin' ? 'text-[#0B2E65]' : 'text-gray-700'}`}>
                          Admin
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Manage your own dealership</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!role}
                    className="cursor-pointer w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </>
              )}

              {/* Step 2: Company & Address */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-3">
                    <select
                      className="cursor-pointer w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={companyType === 'other' ? 'other' : company}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setCompanyType('other');
                          setCompany('');
                        } else {
                          setCompanyType('select');
                          setCompany(e.target.value);
                        }
                      }}
                      required={companyType === 'select'}
                    >
                      <option value="">Select Dealership / Company</option>
                      {knownDealerships.map((dealership) => (
                        <option key={dealership} value={dealership}>
                          {dealership}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                    {companyType === 'other' && (
                      <input
                        type="text"
                        placeholder="Enter Dealership / Company name"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                      />
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Address"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <select
                        className="cursor-pointer w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        value={city === '__other__' ? '__other__' : city}
                        onChange={(e) => {
                          if (e.target.value === '__other__') {
                            setCity('__other__');
                            setCityOther('');
                          } else {
                            setCity(e.target.value);
                            setCityOther('');
                          }
                        }}
                        required
                        disabled={!state}
                      >
                        <option value="">{state ? 'Select City' : 'Select State First'}</option>
                        {state && getCitiesForState(state).length > 0 && getCitiesForState(state).map((cityName) => (
                          <option key={cityName} value={cityName}>
                            {cityName}
                          </option>
                        ))}
                        {state && <option value="__other__">Other (Enter manually)</option>}
                      </select>
                      {!state && (
                        <p className="text-gray-500 mt-1">Please select a state first</p>
                      )}
                      {city === '__other__' && (
                        <input
                          type="text"
                          placeholder="Enter city name"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none mt-2"
                          value={cityOther}
                          onChange={(e) => setCityOther(e.target.value)}
                          required
                        />
                      )}
                    </div>
                    <div>
                      <select
                        className="cursor-pointer w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setCity(''); // Reset city when state changes
                          setCityOther(''); // Reset other city input
                        }}
                        required
                      >
                        <option value="">Select State</option>
                        {usStates.map((stateOption) => (
                          <option key={stateOption.code} value={stateOption.code}>
                            {stateOption.code} - {stateOption.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Account Details */}
              {currentStep === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="First Name"
                        autoComplete="given-name"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Last Name"
                        autoComplete="family-name"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Work Email"
                      autoComplete="email"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password (min 8 chars)"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating…' : 'Create account'}
                    </button>
                  </div>
                </>
              )}

              {/* Login Link - Only show on last step */}
              {currentStep === totalSteps && (
                <div className="text-center text-gray-700">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* What's the Difference Modal */}
      {showDifferenceModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDifferenceModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col z-10">
            {/* Header */}
            <div className="bg-[#0B2E65] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold">Account Type Differences</h2>
              <button
                onClick={() => setShowDifferenceModal(false)}
                className="text-white hover:text-gray-200 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Corporate */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-[#0B2E65] mb-2">Corporate</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Corporate accounts are designed for executive-level users and organizational leadership requiring multi-location oversight capabilities. These accounts provide centralized management and analytics across multiple dealership locations within the corporate structure.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Aggregated data visualization and reporting across all assigned dealership locations</li>
                    <li>Comprehensive analytics dashboard with cross-location performance metrics</li>
                    <li>Comparative analysis tools for evaluating performance across multiple locations</li>
                    <li>Enterprise-wide employee satisfaction trend monitoring and reporting</li>
                    <li>Dealership assignment and management requires administrative configuration</li>
                  </ul>
                </div>

                {/* Manager */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-[#0B2E65] mb-2">Manager</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Manager accounts represent sub-manager roles within a dealership organizational structure. These accounts are subordinate to Administrator accounts, which are typically assigned to General Managers. Manager account creation and provisioning requires administrative authorization from an existing Admin account.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Organizational hierarchy: Sub-manager role reporting to dealership Administrator</li>
                    <li>Access employee survey data and feedback analytics for assigned dealership</li>
                    <li>View performance reports and metrics for designated location</li>
                    <li>Manage survey distribution workflows and employee engagement initiatives</li>
                    <li>Monitor employee satisfaction metrics and engagement trends</li>
                    <li>Account provisioning requires administrative approval and invitation from Admin account holder</li>
                  </ul>
                </div>

                {/* Admin */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0B2E65] mb-2">Admin</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Administrator accounts provide full system access and complete platform administration capabilities. These accounts are typically assigned to General Managers and require an active subscription for account provisioning and feature access.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Complete system administration and platform configuration management</li>
                    <li>User account management across all roles: users, dealerships, and corporate accounts</li>
                    <li>Dealership assignment and organizational structure configuration</li>
                    <li>Manager account registration approval and provisioning authorization</li>
                    <li>Unrestricted access to all platform features and system settings</li>
                    <li>Account activation requires active subscription payment and service agreement</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowDifferenceModal(false)}
                className="cursor-pointer bg-[#0B2E65] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
