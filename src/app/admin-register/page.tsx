'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

function AdminRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [dealershipAddress, setDealershipAddress] = useState('');
  const [dealershipCity, setDealershipCity] = useState('');
  const [dealershipCityOther, setDealershipCityOther] = useState('');
  const [dealershipState, setDealershipState] = useState('');
  const [dealershipZipCode, setDealershipZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

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

  // Prevent body scrolling when admin registration page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Check if user is coming from verification (already verified, just needs to subscribe)
  useEffect(() => {
    const verified = searchParams?.get('verified');
    const verifiedEmail = searchParams?.get('email');
    if (verified === 'true' && verifiedEmail) {
      setEmail(verifiedEmail);
      // Pre-fill form and show message that they just need to subscribe
      toast.success('Email verified! Please log in and complete your subscription to become an admin.');
      // Redirect to login instead - they need to authenticate first
      setTimeout(() => {
        router.push(`/login?redirect=subscription&admin_registration=true&email=${encodeURIComponent(verifiedEmail)}`);
      }, 2000);
    }
  }, [searchParams, router]);

  function nextStep() {
    if (currentStep === 1) {
      // Validate account information before proceeding
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      if (!firstName.trim()) {
        setError('First name is required');
        return;
      }
      if (!lastName.trim()) {
        setError('Last name is required');
        return;
      }
      if (!password) {
        setError('Password is required');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError('Password must be at least 8 characters and include both letters and numbers');
        return;
      }
      setError('');
      setCurrentStep(2);
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!dealershipName.trim()) {
      setError('Dealership name is required');
      return;
    }
    if (!dealershipState.trim()) {
      setError('State is required');
      return;
    }
    const resolvedCity = (dealershipCity === '__other__' ? dealershipCityOther : dealershipCity).trim() || null;
    if (!resolvedCity) {
      setError('City is required');
      return;
    }

    setLoading(true);
    try {
      const verified = searchParams?.get('verified');
      let user_id = null;
      
      // If user is already verified, skip registration and go straight to checkout
      if (verified === 'true') {
        // User is already verified, just need to get their user_id for checkout
        // Try to get user info to find user_id
        try {
          const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
            }),
          });
          
          if (loginRes.ok) {
            // Check content-type before parsing JSON
            const contentType = loginRes.headers.get('content-type');
            let loginData: any = {};
            if (contentType && contentType.includes('application/json')) {
              try {
                loginData = await loginRes.json();
              } catch (err) {
                // JSON parsing failed
                loginData = {};
              }
            } else {
              try {
                loginData = await loginRes.json();
              } catch (err) {
                loginData = {};
              }
            }
            // User exists and password is correct, proceed to checkout
            // We'll get user_id from checkout endpoint
          } else {
            setError('Invalid email or password. Please check your credentials.');
            toast.error('Invalid email or password');
            setLoading(false);
            return;
          }
        } catch (err) {
          setError('Failed to verify credentials. Please try again.');
          toast.error('Failed to verify credentials');
          setLoading(false);
          return;
        }
      } else {
        // New registration - create the user account (include dealership info so backend can save for checkout)
        const registerRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            is_admin_registration: true,  // Flag for admin registration
            dealership_name: dealershipName.trim() || null,
            dealership_address: dealershipAddress.trim() || null,
            dealership_city: resolvedCity,
            dealership_state: dealershipState.trim() || null,
            dealership_zip_code: dealershipZipCode.trim() || null,
          }),
        });

        // Check content-type before parsing JSON
        const contentType = registerRes.headers.get('content-type');
        let registerData: any = {};
        if (contentType && contentType.includes('application/json')) {
          try {
            registerData = await registerRes.json();
          } catch (err) {
            // JSON parsing failed
            registerData = {};
          }
        } else {
          try {
            registerData = await registerRes.json();
          } catch (err) {
            registerData = {};
          }
        }
        
        if (!registerRes.ok) {
          setError(registerData.error || 'Registration failed');
          toast.error(registerData.error || 'Registration failed');
          setLoading(false);
          return;
        }
        
        user_id = registerData.user_id;

        // Store dealership information in localStorage for later use during checkout (use resolved city for "Other")
        if (dealershipName || dealershipAddress || resolvedCity || dealershipState || dealershipZipCode) {
          const dealershipInfo = {
            name: dealershipName.trim(),
            address: dealershipAddress.trim() || null,
            city: resolvedCity,
            state: dealershipState.trim() || null,
            zip_code: dealershipZipCode.trim() || null,
            email: email.trim().toLowerCase(),
          };
          localStorage.setItem('pending_dealership_info', JSON.stringify(dealershipInfo));
        }

        const verificationCode = registerData?.verification_code;
        // Redirect to verification page - user must verify email first, then subscribe
        toast.success('Account created! Please check your email for verification code.');
        const verifyUrl = `/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&admin=true${verificationCode ? `&code=${encodeURIComponent(verificationCode)}` : ''}`;
        router.push(verifyUrl);
        setLoading(false);
        return;
      }

      // If verified, redirect to subscription page (shouldn't happen in normal flow)
      // Normal flow: register -> verify -> subscribe page
      toast.error('Please complete verification first');
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&admin=true`);
    } catch (err) {
      const errorMessage = err instanceof TypeError && err.message === 'Failed to fetch'
        ? `Unable to connect to backend server. Please ensure the backend is deployed and the NEXT_PUBLIC_STAR4CE_API_BASE environment variable is set in your deployment platform (Railway).`
        : (err instanceof Error ? err.message : 'Failed to process registration. Please try again.');
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

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
          <div className="bg-[#E6E6E6] flex-1 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[95vh] relative">
            {/* Back Button */}
            <Link
              href="/register"
              className="absolute top-4 left-4 text-[#0B2E65] hover:text-[#2c5aa0] transition-colors"
              aria-label="Back to Registration Options"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Logo and Tagline */}
            <div className="text-center mb-4">
              <Link href="/" className="inline-block">
                <Logo size="md" className="justify-center mb-4" />
              </Link>
              <p className="text-gray-700 text-base font-medium mb-2">
                Admin Registration
              </p>
              <p className="text-gray-600">
                Subscribe to become an admin and get full access
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center items-center gap-3 mb-6">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-all ${
                    step === currentStep
                      ? 'bg-[#0B2E65]'
                      : step < currentStep
                      ? 'bg-[#0B2E65]'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-5">
              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Account Information</h3>
                    
                    {/* First Name and Last Name Fields */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <input
                          type="text"
                          placeholder="First Name"
                          autoComplete="given-name"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
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
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="mb-3">
                      <input
                        type="email"
                        placeholder="Email *"
                        autoComplete="email"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    {/* Password Field */}
                    <div className="mb-3">
                      <input
                        type="password"
                        placeholder="Password (min 8 chars, letters & numbers) *"
                        autoComplete="new-password"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <input
                        type="password"
                        placeholder="Confirm Password *"
                        autoComplete="new-password"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="cursor-pointer w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                  >
                    Next
                  </button>

                  {/* Links */}
                  <div className="text-center space-y-2 mt-4">
                    <p className="text-gray-700">
                      Already have an account?{' '}
                      <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {/* Step 2: Dealership Information */}
              {currentStep === 2 && (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Dealership Information</h3>
                    
                    {/* Dealership Name */}
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Dealership Name *"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={dealershipName}
                        onChange={(e) => setDealershipName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Street Address"
                        autoComplete="street-address"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={dealershipAddress}
                        onChange={(e) => setDealershipAddress(e.target.value)}
                      />
                    </div>

                    {/* State, City, Zip */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <select
                          className="cursor-pointer w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                          value={dealershipState}
                          onChange={(e) => {
                            setDealershipState(e.target.value);
                            setDealershipCity(''); // Reset city when state changes
                            setDealershipCityOther(''); // Reset other city input
                          }}
                          required
                          aria-required="true"
                        >
                          <option value="">Select State *</option>
                          {usStates.map((stateOption) => (
                            <option key={stateOption.code} value={stateOption.code}>
                              {stateOption.code} - {stateOption.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <select
                          className="cursor-pointer w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                          value={dealershipCity === '__other__' ? '__other__' : dealershipCity}
                          onChange={(e) => {
                            if (e.target.value === '__other__') {
                              setDealershipCity('__other__');
                              setDealershipCityOther('');
                            } else {
                              setDealershipCity(e.target.value);
                              setDealershipCityOther('');
                            }
                          }}
                          disabled={!dealershipState}
                          required
                          aria-required="true"
                        >
                          <option value="">{dealershipState ? 'Select City *' : 'Select State First'}</option>
                          {dealershipState && getCitiesForState(dealershipState).length > 0 && getCitiesForState(dealershipState).map((cityName) => (
                            <option key={cityName} value={cityName}>
                              {cityName}
                            </option>
                          ))}
                          {dealershipState && <option value="__other__">Other (Enter manually)</option>}
                        </select>
                        {!dealershipState && (
                          <p className="text-gray-500 mt-1 text-sm">Please select a state first</p>
                        )}
                        {dealershipCity === '__other__' && (
                          <input
                            type="text"
                            placeholder="Enter city name"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent mt-2"
                            value={dealershipCityOther}
                            onChange={(e) => setDealershipCityOther(e.target.value)}
                            required
                          />
                        )}
                      </div>
                    </div>

                    {/* Zip Code */}
                    <div>
                      <input
                        type="text"
                        placeholder="Zip Code"
                        autoComplete="postal-code"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={dealershipZipCode}
                        onChange={(e) => setDealershipZipCode(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[#0B2E65]">Next Steps:</h3>
                    <p className="text-sm text-gray-700">
                      After registration, you'll receive a verification email. Once verified, you'll be able to choose your subscription plan and become an admin.
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 mt-4">
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
                      {loading ? 'Processing...' : 'Register as Admin'}
                    </button>
                  </div>
                </>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AdminRegisterPageContent />
    </Suspense>
  );
}

