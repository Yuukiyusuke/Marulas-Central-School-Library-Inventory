const STORAGE_KEY = "little-library-books-v1";
const READER_TOUR_SEEN_KEY = "little-library-reader-tour-seen-v1";
const ACCESSIBILITY_PREFERENCES_KEY = "little-library-accessibility-v1";
const COLOR_THEMES = ["storybook", "ocean", "meadow", "sunset"];
const passwordEyeIcon = '<svg class="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="password-eye-closed"><path class="password-eye-line" d="M3 7.5c2.1 4.8 5.2 8.2 9 8.2s6.9-3.4 9-8.2"/><path class="password-eye-lashes" d="m5.2 11.5-1.6 2.2M9.2 14.8l-.9 3.1m6.5-3.1.9 3.1m3.1-6.4 1.6 2.2"/></g><g class="password-eye-open"><path class="password-eye-line" d="M2.1 12C4.3 7.7 7.6 5 12 5s7.7 2.7 9.9 7C19.7 16.3 16.4 19 12 19S4.3 16.3 2.1 12Z"/><circle class="password-eye-pupil" cx="12" cy="12" r="3.1"/></g></svg>';
const adminRoleIcon = '<svg class="admin-role-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="7" r="3" fill="currentColor"/><path d="M3.5 20v-1.2c0-3.1 2.5-5.6 5.5-5.6s5.5 2.5 5.5 5.6V20z" fill="currentColor"/><path d="m18.3 11.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" fill="currentColor" stroke="white" stroke-width=".7"/></svg>';

function loadAccessibilityPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY) || "{}");
    const savedTextSize = ["normal", "large", "extra-large"].includes(saved.textSize)
      ? saved.textSize
      : saved.largerText === true ? "large" : "normal";
    return {
      textSize: savedTextSize,
      highContrast: saved.highContrast === true,
      theme: saved.theme === "dark" ? "dark" : "light",
      colorTheme: COLOR_THEMES.includes(saved.colorTheme) ? saved.colorTheme : "storybook",
      language: saved.language === "fil" ? "fil" : "en"
    };
  } catch {
    return { textSize: "normal", highContrast: false, theme: "light", colorTheme: "storybook", language: "en" };
  }
}

let accessibilityPreferences = loadAccessibilityPreferences();

const FILIPINO_TRANSLATIONS = {
  "MY BOOKS": "AKING MGA AKLAT",
  "All stories": "Lahat ng kuwento",
  "All": "Lahat",
  "Ready to read": "Handa nang basahin",
  "Ready": "Handa na",
  "Borrowed out": "Hiniram",
  "Borrowed": "Hiniram",
  "Overdue": "Lampas na",
  "Due today": "Dapat ibalik ngayong araw",
  "Due tomorrow": "Dapat ibalik bukas",
  "loan": "hiram",
  "loans": "mga hiram",
  "STORY WORLDS": "MGA MUNDO NG KUWENTO",
  "Reading takes you everywhere!": "Dinadala ka ng pagbabasa kahit saan!",
  "Your shelf is saved here": "Naka-save dito ang iyong estante",
  "My library": "Aking aklatan",
  "All books": "Lahat ng aklat",
  "Settings": "Mga Setting",
  "Open settings": "Buksan ang mga setting",
  "Take a quick tour": "Mabilis na paglilibot",
  "A QUICK SETTINGS TOUR": "MABILIS NA PAGLILIBOT SA MGA SETTING",
  "Make reading feel just right": "Gawing komportable ang pagbabasa",
  "Four tiny tips. You can change these choices anytime.": "Apat na maikling tip. Puwede mong baguhin ang mga pinili anumang oras.",
  "You are doing great!": "Ang galing mo!",
  "1. PICK YOUR TEXT SIZE": "1. PUMILI NG LAKI NG TITIK",
  "Make letters bigger or smaller": "Palakihin o paliitin ang mga titik",
  "Tap each size to preview the same words.": "Pindutin ang bawat laki para silipin ang parehong mga salita.",
  "The little fox.": "Ang munting soro.",
  "Text size preview": "Silipin ang laki ng titik",
  "2. CHOOSE A LOOK": "2. PUMILI NG ITSURA",
  "Bright by day, cozy by night": "Maliwanag sa araw, banayad sa gabi",
  "Light is like reading in daytime; Dark feels cozy at night. Try the Storybook, Ocean, Meadow, or Sunset colors.": "Parang nagbabasa sa araw ang Maliwanag; banayad sa gabi ang Madilim. Subukan ang mga kulay ng Kuwento, Karagatan, Luntiang parang, o Takipsilim.",
  "3. HELP WORDS STAND OUT": "3. GAWING MAS LITAW ANG MGA SALITA",
  "Make words easier to spot": "Gawing mas madaling makita ang mga salita",
  "Turn on stronger contrast to make words and buttons easier to spot.": "Buksan ang mas matitingkad na kulay para mas madaling makita ang mga salita at button.",
  "4. CHOOSE A LANGUAGE": "4. PUMILI NG WIKA",
  "Read in words you know": "Magbasa sa wikang alam mo",
  "Choose English or Filipino. The language menu changes page words, like Hello and Kumusta.": "Pumili ng Ingles o Filipino. Papalitan ng menu ng wika ang mga salita sa pahina, tulad ng Hello at Kumusta.",
  "Reading settings tour progress": "Pag-usad ng gabay sa mga setting sa pagbasa",
  "Finish tour": "Tapusin ang gabay",
  "Signed in as": "Naka-sign in bilang",
  "Reader": "Mambabasa",
  "Sign out": "Mag-sign out",
  "Sign out from Reader account": "Mag-sign out sa account ng Mambabasa",
  "Sign out from Admin account": "Mag-sign out sa account ng Admin",
  "OPEN A BOOK, OPEN A WORLD": "BUKASAN ANG AKLAT, BUKSAN ANG MUNDO",
  "Welcome, book explorer": "Maligayang pagdating, tagahanap ng kuwento",
  "Pick a story, meet a character, and let your imagination go!": "Pumili ng kuwento, makilala ang tauhan, at hayaang gumala ang iyong imahinasyon!",
  "Show me how books work": "Ipakita kung paano gamitin ang aklatan",
  "Set up recovery key": "Mag-set up ng recovery key",
  "Replace recovery key": "Palitan ang recovery key",
  "Account passwords": "Mga password ng account",
  "Books on our shelf": "Mga aklat sa aming estante",
  "A whole world of stories": "Buong mundong puno ng kuwento",
  "Ready for a reader": "Handa na para sa mambabasa",
  "Which one will you pick?": "Alin ang pipiliin mo?",
  "Books borrowed": "Mga hiniram na aklat",
  "Currently with students": "Nasa mga mag-aaral ngayon",
  "BOOKS & RETURNS": "MGA AKLAT AT PAGBABALIK",
  "Library snapshots": "Sulyap sa aklatan",
  "A little look at favorite books and return rhythms.": "Tingnan ang mga paboritong aklat at kung kailan ito ibinabalik.",
  "📚 Find borrowing history": "📚 Hanapin ang talaan ng mga hiniram",
  "Most borrowed books": "Mga aklat na pinakamaraming hiniram",
  "Reader favorites on our shelf": "Mga paborito ng mga mambabasa",
  "Return patterns": "Mga tala sa pagbabalik",
  "Did books come back on time?": "Naibalik ba ang mga aklat sa tamang oras?",
  "On time": "Nasa tamang oras",
  "Late": "Nahuli",
  "Completed returns with due dates will show here.": "Lalabas dito ang mga naibalik na aklat na may takdang petsa.",
  "No return data yet": "Wala pang tala ng pagbabalik",
  "No completed returns with due dates yet": "Wala pang naibalik na aklat na may takdang petsa",
  "RETURN CHECK": "PAGSUSURI NG PAGBABALIK",
  "Books coming back": "Mga aklat na dapat ibalik",
  "See what’s overdue and what’s due this week.": "Tingnan ang mga lampas na sa takdang balik at dapat ibalik ngayong linggo.",
  "Next 7 days": "Sa susunod na 7 araw",
  "By due date": "Ayon sa petsa ng pagbabalik",
  "Overdue by student": "Mga lampas sa takdang balik ayon sa mag-aaral",
  "Ready to come home": "Oras na para umuwi",
  "Due this week": "Dapat ibalik ngayong linggo",
  "Coming back soon": "Pauwi na sa lalong madaling panahon",
  "Reminders by student": "Mga paalala ayon sa mag-aaral",
  "Each reader’s overdue books are together in one place.": "Magkakasama rito ang mga aklat na lampas na sa takdang balik ng bawat mambabasa.",
  "Past due": "Lampas na sa takdang petsa",
  "Choose a story": "Pumili ng kuwento",
  "Find your next favorite adventure!": "Hanapin ang susunod mong paboritong kuwento!",
  "Add a story": "Magdagdag ng kuwento",
  "books to explore": "aklat na puwedeng tuklasin",
  "No stories found": "Walang nakitang kuwento",
  "Manage your shelf": "Pamahalaan ang iyong estante",
  "These books are past their return date.": "Lampas na sa petsa ng pagbabalik ang mga aklat na ito.",
  "Add new books or remove books from the shelf.": "Magdagdag o mag-alis ng mga aklat sa estante.",
  "These books are currently with a student.": "Nasa isang mag-aaral ngayon ang mga aklat na ito.",
  "Pick a book to borrow and enjoy!": "Pumili ng aklat na hihiramin at babasahin!",
  "Try another search, or add a new book to your shelf.": "Subukan ang ibang paghahanap o magdagdag ng aklat sa estante.",
  "Show all books": "Ipakita ang lahat ng aklat",
  "A whole world in every book": "May buong mundo sa bawat aklat",
  "A NEW ADVENTURE IS JOINING": "MAY BAGONG KUWENTONG DUMARATING",
  "Add a new story": "Magdagdag ng bagong kuwento",
  "Add the details and give this book a happy home.": "Ilagay ang mga detalye at bigyan ng tahanan ang aklat na ito.",
  "UPDATE THIS STORY": "I-UPDATE ANG KUWENTONG ITO",
  "Edit book details": "I-edit ang mga detalye ng aklat",
  "Update the details or choose a new cover picture.": "I-update ang mga detalye o pumili ng bagong larawan ng pabalat.",
  "Save book changes": "I-save ang mga pagbabago",
  "Book title": "Pamagat ng aklat",
  "Author": "May-akda",
  "Story world": "Uri ng kuwento",
  "Picture Books": "Mga aklat na may larawan",
  "Adventure": "Pakikipagsapalaran",
  "Animals": "Mga hayop",
  "Fairy Tales": "Kuwentong pambata",
  "Learning": "Pag-aaral",
  "Other": "Iba pa",
  "Cover picture": "Larawan ng pabalat",
  "optional": "opsyonal",
  "Choose a cover picture": "Pumili ng larawan ng pabalat",
  "JPG or PNG, up to 8 MB": "JPG o PNG, hanggang 8 MB",
  "Browse": "Pumili",
  "Add to my bookshelf": "Idagdag sa aking estante",
  "Current cover is shown": "Ipinapakita ang kasalukuyang pabalat",
  "Choose a new picture to replace it": "Pumili ng bagong larawang ipapalit",
  "Picture preview ready": "Handa na ang paunang tingin sa larawan",
  "LEND A BOOK TO A READER": "HUMIRAM NG AKLAT",
  "Who is borrowing?": "Sino ang hihiram?",
  "Add the student’s name and we’ll keep track until the book comes back.": "Ilagay ang pangalan ng mag-aaral para matandaan natin hanggang maibalik ang aklat.",
  "Student’s name": "Pangalan ng mag-aaral",
  "Bring it back by": "Ibalik bago sumapit ang",
  "Lend this book": "Hiramin ang aklat na ito",
  "LIBRARY ADMIN": "TAGAPAMAHALA NG AKLATAN",
  "Remove this book?": "Alisin ang aklat na ito?",
  "This will remove the book and its borrowing details from this shelf.": "Aalisin nito ang aklat at ang mga tala ng panghihiram nito sa estante.",
  "Keep book": "Itago ang aklat",
  "Remove book": "Alisin ang aklat",
  "STORY SHELF MEMORIES": "MGA TALA SA ESTANTE",
  "Borrowing history": "Talaan ng mga hiniram",
  "Book borrowing history": "Talaan ng mga hiniram na aklat",
  "Library borrowing history": "Talaan ng mga hiniram sa aklatan",
  "Search book titles, then filter loans by student, date, and status.": "Hanapin ang pamagat ng aklat, saka salain ayon sa mag-aaral, petsa, o kalagayan.",
  "All books in our library": "Lahat ng aklat sa aming aklatan",
  "Student": "Mag-aaral",
  "Borrowed from": "Hiniram mula",
  "Borrowed through": "Hiniram hanggang",
  "Loan status": "Kalagayan ng hiram",
  "All statuses": "Lahat ng kalagayan",
  "Returned": "Naibalik",
  "Currently borrowed": "Kasalukuyang hiniram",
  "returned": "naibalik",
  "currently borrowed": "kasalukuyang hiniram",
  "overdue": "lampas na sa takdang balik",
  "Reading now": "Binabasa ngayon",
  "Clear filters": "Alisin ang mga salaan",
  "Filter borrowing history": "Salain ang talaan ng mga hiniram",
  "Filter history by status": "Salain ang talaan ayon sa kalagayan",
  "Type a student name": "I-type ang pangalan ng mag-aaral",
  "Search book titles": "Maghanap ng pamagat ng aklat",
  "MAKE READING COMFY": "Gawing komportable ang pagbabasa",
  "Pick the colors and text you like best.": "Piliin ang mga kulay at laki ng titik na gusto mo.",
  "Choose a language": "Pumili ng wika",
  "Choose words that feel easy to read.": "Pumili ng wikang madaling basahin.",
  "Language": "Wika",
  "Choose a look": "Pumili ng itsura",
  "Pick bright or cozy colors.": "Pumili ng maliwanag o banayad na mga kulay.",
  "Light": "Maliwanag",
  "Bright and sunny": "Maliwanag at masaya",
  "Dark": "Madilim",
  "Soft on your eyes": "Banayad sa iyong mga mata",
  "Pick your story colors": "Pumili ng kulay ng kuwento",
  "Choose the colors for your library.": "Piliin ang mga kulay ng iyong aklatan.",
  "Live preview": "Paunang tingin",
  "Choose a color to see it on a book and buttons.": "Pumili ng kulay para makita ang itsura nito sa aklat at mga button.",
  "Storybook": "Kuwento",
  "Purple and gold": "Lila at ginto",
  "Ocean": "Karagatan",
  "Blue and aqua": "Asul at bughaw-dagat",
  "Meadow": "Luntiang parang",
  "Leafy green": "Luntiang dahon",
  "Sunset": "Takipsilim",
  "Peach and coral": "Peach at korales",
  "Choose text size": "Pumili ng laki ng titik",
  "Pick letters that feel easy to read.": "Pumili ng mga titik na madaling basahin.",
  "Normal": "Karaniwan",
  "Large": "Malaki",
  "Extra-large": "Napakalaki",
  "Details": "Mga detalye",
  "Make words easier to see": "Gawing mas madaling makita ang mga salita",
  "Use stronger colors on text and buttons.": "Gumamit ng mas matingkad na kulay sa mga salita at button.",
  "Changes show right away.": "Makikita agad ang mga pagbabago.",
  "Changes show right away and save here.": "Makikita agad at mase-save dito ang mga pagbabago.",
  "Saved here. You can change it anytime.": "Naka-save dito. Puwede mo itong baguhin anumang oras.",
  "Your choices work, but this browser can't save them.": "Gagana ang mga pinili mo, pero hindi ito ma-save ng browser na ito.",
  "Done": "Tapos na",
  "Close settings": "Isara ang mga setting",
  "WELCOME BACK": "MALIGAYANG PAGBABALIK",
  "A NEW LIBRARY ADVENTURE": "BAGONG PAKIKIPAGSAPALARAN SA AKLATAN",
  "Sign in to your library": "Mag-sign in sa iyong aklatan",
  "Set up your library": "I-set up ang iyong aklatan",
  "Choose your role and enter its password.": "Piliin kung Admin o Mambabasa ka, saka ilagay ang password.",
  "Choose passwords for the Admin and shared Reader accounts.": "Pumili ng password para sa Admin at sa pinagsasaluhang account ng Mambabasa.",
  "Admin": "Admin",
  "Password": "Password",
  "Forgot Reader password?": "Nakalimutan ang password ng Mambabasa?",
  "Follow the checklist to create both accounts. You’ll save a recovery key at the end.": "Sundin ang listahan para gumawa ng dalawang account. I-save ang recovery key sa huli.",
  "Account setup": "Pag-set up ng account",
  "Account setup progress": "Pag-usad ng pag-set up ng account",
  "Account setup checklist": "Listahan sa pag-set up ng account",
  "Choose sign-in role": "Pumili ng uri ng pag-sign in",
  "Admin password strength": "Tibay ng password ng Admin",
  "Reader password strength": "Tibay ng password ng Mambabasa",
  "New password strength": "Tibay ng bagong password",
  "New Admin password strength": "Tibay ng bagong password ng Admin",
  "New Reader password strength": "Tibay ng bagong password ng Mambabasa",
  "Admin account": "Account ng Admin",
  "Reader account": "Account ng Mambabasa",
  "Admin password": "Password ng Admin",
  "Reader password": "Password ng Mambabasa",
  "Confirm Admin password": "Kumpirmahin ang password ng Admin",
  "Confirm Reader password": "Kumpirmahin ang password ng Mambabasa",
  "For the person who manages the library.": "Para sa taong namamahala sa aklatan.",
  "To do": "Gagawin pa",
  "In progress": "Ginagawa na",
  "For readers who borrow and return books.": "Para sa mga mambabasang humihiram at nagbabalik ng aklat.",
  "Shared Reader password": "Pinagsasaluhang password ng Mambabasa",
  "Use at least 6 characters for each password.": "Gumamit ng hindi bababa sa 6 na character sa bawat password.",
  "Complete the Admin account step to continue.": "Kumpletuhin muna ang hakbang para sa Admin account.",
  "Create passwords and start": "Gumawa ng mga password at magsimula",
  "Sign in as Reader": "Mag-sign in bilang Mambabasa",
  "ACCOUNT RECOVERY": "PAGBAWI NG ACCOUNT",
  "Reset Reader password": "I-reset ang password ng Mambabasa",
  "Use the library recovery key saved during setup. The key can reset either account.": "Gamitin ang recovery key na na-save noong pag-set up. Puwede nitong i-reset ang alinmang account.",
  "Library recovery key": "Recovery key ng aklatan",
  "No recovery key? Ask an Admin to sign in and set one up.": "Walang recovery key? Hilingin sa Admin na mag-sign in at gumawa nito.",
  "New password": "Bagong password",
  "Confirm new password": "Kumpirmahin ang bagong password",
  "Reset password": "I-reset ang password",
  "ADMIN ACCOUNT SAFETY": "KALIGTASAN NG ADMIN ACCOUNT",
  "Set up account recovery": "I-set up ang pag-recover ng account",
  "Create a private key that can reset either library password.": "Gumawa ng pribadong key na makakapag-reset ng alinmang password sa aklatan.",
  "A new key will replace the old one. Save the new key somewhere private so you can reset either password.": "Papalitan ng bagong key ang luma. Itago ang bagong key sa pribadong lugar para ma-reset mo ang alinmang password.",
  "Create a private key that can reset either library password. Save it somewhere safe. It will only be shown once.": "Gumawa ng pribadong key para ma-reset ang alinmang password sa aklatan. Itago ito nang ligtas. Isang beses lang ito ipapakita.",
  "Replace the recovery key?": "Palitan ang recovery key?",
  "Not now": "Mamaya na",
  "Create recovery key": "Gumawa ng recovery key",
  "Keep it somewhere private. It can reset the Admin or shared Reader password. This key is shown only once.": "Itago ito sa pribadong lugar. Puwede nitong i-reset ang password ng Admin o Mambabasa. Isang beses lang ito ipapakita.",
  "Your recovery key": "Iyong recovery key",
  "Copy": "Kopyahin",
  "I saved the key": "Na-save ko na ang key",
  "Save this recovery key": "I-save ang recovery key na ito",
  "ADMIN ACCOUNT SETTINGS": "MGA SETTING NG ADMIN ACCOUNT",
  "Update the password for the person managing the library or for everyone who signs in as Reader.": "Palitan ang password ng namamahala sa aklatan o ng lahat ng nag-sign in bilang Mambabasa.",
  "Confirm your current password first. This session stays signed in; other Admin sessions will need the new password.": "Kumpirmahin muna ang kasalukuyang password. Mananatiling naka-sign in dito; gagamit ng bagong password ang ibang Admin.",
  "Current Admin password": "Kasalukuyang password ng Admin",
  "New Admin password": "Bagong password ng Admin",
  "Confirm new Admin password": "Kumpirmahin ang bagong password ng Admin",
  "Change Admin password": "Palitan ang password ng Admin",
  "Choose a new password for all Readers. They will need to sign in again afterward.": "Pumili ng bagong password para sa lahat ng Mambabasa. Kailangan nilang mag-sign in muli.",
  "New Reader password": "Bagong password ng Mambabasa",
  "Confirm new Reader password": "Kumpirmahin ang bagong password ng Mambabasa",
  "Change Reader password": "Palitan ang password ng Mambabasa",
  "Close account password settings": "Isara ang mga setting ng password",
  "YOUR LIBRARY ADVENTURE": "ANG IYONG PAKIKIPAGSAPALARAN SA AKLATAN",
  "Three little steps to story time": "Tatlong simpleng hakbang para magbasa",
  "Here’s how to find a book, take it on an adventure, and bring it back.": "Ganito maghanap, humiram, at magbalik ng aklat.",
  "You’re doing great!": "Ang galing mo!",
  "1. FIND A STORY": "1. MAGHANAP NG KUWENTO",
  "Pick your next adventure": "Piliin ang susunod mong pakikipagsapalaran",
  "Search for a book or author, or choose a Story World. Look for a book marked": "Maghanap ng aklat o may-akda, o pumili ng uri ng kuwento. Hanapin ang aklat na may markang",
  "2. BORROW A BOOK": "2. HUMIRAM NG AKLAT",
  "Take a story with you": "Mag-uwi ng kuwento",
  "Press": "Pindutin ang",
  "Borrow this book": "Hiramin ang aklat na ito",
  ", then add your name so your teacher knows who is reading it. You can add a return date too.": ", saka ilagay ang pangalan mo para malaman ng guro kung sino ang nagbabasa. Puwede ka ring maglagay ng petsa ng pagbabalik.",
  "3. RETURN A BOOK": "3. MAGBALIK NG AKLAT",
  "Make room for another reader": "Magbigay-daan sa susunod na mambabasa",
  "When you finish, find your book under": "Kapag tapos ka na, hanapin ang aklat sa",
  "and press": "at pindutin ang",
  "Mark as returned": "Markahang naibalik na",
  ". Now it is ready for a new adventure!": ". Handa na ito para sa bagong mambabasa!",
  "Skip tour": "Laktawan ang gabay",
  "Back": "Bumalik",
  "Next": "Susunod",
  "Let’s read!": "Magbasa na tayo!",
  "Main navigation": "Pangunahing menu",
  "Little Library home": "Pangunahing pahina ng Little Library",
  "Filter by category": "Salain ayon sa uri",
  "Library summary": "Buod ng aklatan",
  "Choose a reminder view": "Pumili ng paalala",
  "Search for a story or author...": "Maghanap ng kuwento o may-akda...",
  "Search for a story or author": "Maghanap ng kuwento o may-akda",
  "Close": "Isara",
  "e.g. The Very Hungry Caterpillar": "hal. The Very Hungry Caterpillar",
  "Who wrote it?": "Sino ang sumulat nito?",
  "Type the student’s name": "I-type ang pangalan ng mag-aaral",
  "Close password recovery": "Isara ang pag-recover ng password",
  "Close recovery key": "Isara ang recovery key",
  "One-time library recovery key": "Isang beses lang ipapakitang recovery key ng aklatan",
  "Close tour": "Isara ang gabay",
  "Library tour progress": "Pag-usad ng gabay sa aklatan",
  "Show password": "Ipakita ang password",
  "Hide password": "Itago ang password",
  "Enter a password to check its strength.": "Maglagay ng password para masukat ang tibay nito.",
  "Almost there — use at least 6 characters.": "Malapit na — gumamit ng hindi bababa sa 6 na character.",
  "Good start! A longer password is stronger.": "Magandang simula! Mas matibay ang mas mahabang password.",
  "Nice and strong!": "Matibay na iyan!",
  "Super strong!": "Napakatibay!",
  "Repeat the password to check it matches.": "Ulitin ang password para malaman kung magkatugma.",
  "Type it again to check for a match.": "I-type ulit para malaman kung magkatugma.",
  "Enter the Admin password first.": "Ilagay muna ang password ng Admin.",
  "Enter the Reader password first.": "Ilagay muna ang password ng Mambabasa.",
  "The passwords match!": "Magkatugma ang mga password!",
  "The passwords do not match yet.": "Hindi pa magkatugma ang mga password.",
  "The Admin passwords do not match.": "Hindi magkatugma ang mga password ng Admin.",
  "The Reader passwords do not match.": "Hindi magkatugma ang mga password ng Mambabasa.",
  "The local library server could not be reached.": "Hindi maabot ang server ng aklatan.",
  "That library action could not be completed.": "Hindi natapos ang kilos na iyon sa aklatan.",
  "Please sign in again.": "Mag-sign in muli.",
  "This action is not allowed for your account.": "Hindi puwede ang kilos na ito sa iyong account.",
  "That password did not match. Please try again.": "Hindi tugma ang password. Subukan ulit.",
  "Too many tries. Please wait 30 seconds and try again.": "Masyadong maraming pagsubok. Maghintay ng 30 segundo at subukan ulit.",
  "Choose Admin or Reader.": "Piliin ang Admin o Mambabasa.",
  "Set up the library before signing in.": "I-set up muna ang aklatan bago mag-sign in.",
  "Set up the library before recovering an account.": "I-set up muna ang aklatan bago i-recover ang account.",
  "A recovery key has not been set up. Ask an Admin to sign in and create one first.": "Wala pang recovery key. Hilingin sa Admin na mag-sign in at gumawa muna nito.",
  "That recovery key did not match. Check it and try again.": "Hindi tugma ang recovery key. Suriin ito at subukan ulit.",
  "That book is no longer on the shelf.": "Wala na sa estante ang aklat na iyon.",
  "That book has already been borrowed.": "May humiram na sa aklat na iyon.",
  "That book is already on the shelf.": "Nasa estante na ang aklat na iyon.",
  "Add a student name of up to 60 characters.": "Ilagay ang pangalan ng mag-aaral na hanggang 60 character.",
  "Choose a valid due date.": "Pumili ng wastong petsa ng pagbabalik.",
  "Choose one of the listed book categories.": "Pumili ng uri mula sa listahan.",
  "The current Admin password did not match. Please try again.": "Hindi tugma ang kasalukuyang password ng Admin. Subukan ulit.",
  "The library has already been set up.": "Na-set up na ang aklatan.",
  "The cover picture must be a small JPEG image.": "Pumili ng maliit na JPEG na larawan para sa pabalat.",
  "The cover picture data is not valid.": "Hindi wasto ang datos ng larawan ng pabalat.",
  "Each book needs a title of 1 to 80 characters.": "Kailangan ng pamagat na may 1 hanggang 80 character ang bawat aklat.",
  "An author name is too long.": "Masyadong mahaba ang pangalan ng may-akda.",
  "A student name is too long.": "Masyadong mahaba ang pangalan ng mag-aaral.",
  "A due date must use year-month-day format.": "Gamitin ang format na taon-buwan-araw sa petsa ng pagbabalik.",
  "A title must be between 1 and 80 characters.": "Dapat may 1 hanggang 80 character ang pamagat.",
  "An author name can have up to 60 characters.": "Hanggang 60 character lang dapat ang pangalan ng may-akda.",
  "The initial shelf has too many books.": "Napakaraming aklat sa unang estante.",
  "Copy failed.": "Hindi nakopya ang key.",
  "Use at least 6 characters for the new password.": "Gumamit ng hindi bababa sa 6 na character sa bagong password.",
  "Use at least 6 characters for the new Admin password.": "Gumamit ng hindi bababa sa 6 na character sa bagong password ng Admin.",
  "Use at least 6 characters for the new Reader password.": "Gumamit ng hindi bababa sa 6 na character sa bagong password ng Mambabasa.",
  "The new passwords do not match yet.": "Hindi pa magkatugma ang mga bagong password.",
  "The Admin passwords do not match yet.": "Hindi pa magkatugma ang mga password ng Admin.",
  "The Reader passwords do not match yet.": "Hindi pa magkatugma ang mga password ng Mambabasa.",
  "First, set an Admin password and confirm it.": "Una, magtakda at magkumpirma ng password para sa Admin.",
  "The Admin password is ready. Next, set a shared Reader password.": "Handa na ang password ng Admin. Sunod, magtakda ng pinagsasaluhang password ng Mambabasa.",
  "Both accounts are ready! You can start your library.": "Handa na ang dalawang account! Simulan na ang iyong aklatan.",
  "Enter the library recovery key, then choose a new password.": "Ilagay ang recovery key ng aklatan, saka pumili ng bagong password.",
  "Recovery key copied. Keep it somewhere private.": "Nakopya ang recovery key. Itago ito sa pribadong lugar.",
  "The key is selected. Copy it and keep it somewhere private.": "Napili ang key. Kopyahin at itago ito sa pribadong lugar.",
  "Updating password...": "Pinapalitan ang password...",
  "Admin password updated. This session is still signed in.": "Napaltan ang password ng Admin. Naka-sign in ka pa rin.",
  "Reader password updated. Readers will need to sign in again.": "Napaltan ang password ng Mambabasa. Kailangang mag-sign in muli ang mga Mambabasa.",
  "You have signed out. Choose a role to sign back in.": "Nag-sign out ka na. Pumili ng account para mag-sign in muli.",
  "The date range needs a quick check.": "Pakisuri ang saklaw ng mga petsa.",
  "No loans match these filters. Try another book title, student, or date range.": "Walang hiram na tugma sa mga salaan. Subukan ang ibang pamagat, mag-aaral, o petsa.",
  "No borrowing records for this book yet.": "Wala pang tala ng panghihiram para sa aklat na ito.",
  "No borrowing records in this library yet.": "Wala pang tala ng panghihiram sa aklatang ito.",
  "Date not recorded": "Hindi naitala ang petsa",
  "Due date not recorded": "Hindi naitala ang petsa ng pagbabalik",
  "No overdue books. Hooray!": "Walang aklat na lampas sa takdang balik. Yehey!",
  "No books due in the next 7 days.": "Walang aklat na kailangang ibalik sa susunod na 7 araw.",
  "No student reminders right now. Hooray!": "Walang paalala para sa mag-aaral ngayon. Yehey!",
  "Student name not recorded": "Hindi naitala ang pangalan ng mag-aaral",
  "Author not added": "Wala pang may-akda",
  "a student": "isang mag-aaral",
  "Out exploring": "Nasa pakikipagsapalaran",
  "Reading with": "Binabasa ni",
  "Borrow a book to start our reader favorites list.": "Humiram ng aklat para makapagsimula ang listahan ng mga paborito.",
  "Back by": "Ibalik bago",
  "You can borrow it when it returns.": "Puwede mo itong hiramin kapag naibalik na.",
  "Please add the student's name.": "Ilagay ang pangalan ng mag-aaral.",
  "That picture is too big. Please choose one under 8 MB.": "Masyadong malaki ang larawang iyon. Pumili ng larawang mas maliit sa 8 MB.",
  "Could not read that picture.": "Hindi mabasa ang larawang iyon.",
  "That picture could not be opened.": "Hindi mabuksan ang larawang iyon.",
  "Book details updated!": "Na-update ang mga detalye ng aklat!",
  "A new story found its way to your shelf!": "May bagong kuwentong dumating sa iyong estante!",
  "That book is back on the shelf!": "Naibalik na ang aklat sa estante!",
  "Borrowing history for": "Talaan ng mga hiniram para sa",
  "View borrowing history for": "Tingnan ang talaan ng mga hiniram para sa",
  "Mark": "Markahan",
  "as returned": "bilang naibalik na",
  "Edit": "I-edit",
  "Remove": "Alisin",
  "A GOOD STORY": "MAGANDANG KUWENTO",
  "Cover of": "Pabalat ng",
  "Preview of": "Paunang tingin sa",
  "Current cover for": "Kasalukuyang pabalat para sa",
  "No books due": "Walang aklat na dapat ibalik",
  "No loans match": "Walang tugmang hiram",
  "That library page was not found.": "Hindi nakita ang pahinang iyon ng aklatan."
};

const localizedTextState = new WeakMap();
const localizedAttributeState = new WeakMap();
const LOCALIZED_ATTRIBUTES = ["placeholder", "aria-label", "aria-valuetext", "title", "alt"];

function currentLocale() {
  return accessibilityPreferences.language === "fil" ? "fil-PH" : "en-US";
}

function translateUiText(source) {
  if (accessibilityPreferences.language !== "fil") return source;
  const trimmed = source.trim();
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  let translated = FILIPINO_TRANSLATIONS[trimmed];
  if (translated === undefined) {
    let match;
    if ((match = /^(\d+) days? overdue$/.exec(trimmed))) translated = `${match[1]} araw nang lampas sa takdang balik`;
    else if ((match = /^Due in (\d+) days?$/.exec(trimmed))) translated = `Ibalik sa loob ng ${match[1]} araw`;
    else if ((match = /^(\d+) loans?$/.exec(trimmed))) translated = `${match[1]} na hiram`;
    else if ((match = /^(\d+) loans? found$/.exec(trimmed))) translated = `May nakitang ${match[1]} na hiram`;
    else if ((match = /^(\d+) books? overdue$/.exec(trimmed))) translated = `${match[1]} aklat na lampas sa takdang balik`;
    else if ((match = /^Step (\d+) of (\d+)$/.exec(trimmed))) translated = `Hakbang ${match[1]} sa ${match[2]}`;
    else if ((match = /^(\d+) of (\d+) steps complete$/.exec(trimmed))) translated = `Kumpleto ang ${match[1]} sa ${match[2]} hakbang`;
    else if ((match = /^With (.+)$/.exec(trimmed))) translated = `Hawak ni ${match[1]}`;
    else if ((match = /^Back by (.+)$/.exec(trimmed))) translated = `Ibalik bago ${match[1]}`;
    else if ((match = /^Borrowed (.+) \u00b7 Due back (.+?)(?: \u00b7 Returned (.+))?$/.exec(trimmed))) translated = `Hiniram noong ${match[1]} \u00b7 Ibalik sa ${match[2]}${match[3] ? ` \u00b7 Naibalik noong ${match[3]}` : ""}`;
    else if ((match = /^Borrowed (.+) \u00b7 Due date not recorded(?: \u00b7 Returned (.+))?$/.exec(trimmed))) translated = `Hiniram noong ${match[1]} \u00b7 Hindi naitala ang petsa ng pagbabalik${match[2] ? ` \u00b7 Naibalik noong ${match[2]}` : ""}`;
    else if ((match = /^· Back by (.+)$/.exec(trimmed))) translated = `· Ibalik bago ${match[1]}`;
    else if ((match = /^Due back (.+)$/.exec(trimmed))) translated = `Ibalik sa ${match[1]}`;
    else if ((match = /^· Returned (.+)$/.exec(trimmed))) translated = `· Naibalik noong ${match[1]}`;
    else if ((match = /^Borrowed (.+)$/.exec(trimmed))) translated = `Hiniram noong ${match[1]}`;
    else if ((match = /^Cover of (.+)$/.exec(trimmed))) translated = `Pabalat ng ${match[1]}`;
    else if ((match = /^Preview of (.+)$/.exec(trimmed))) translated = `Paunang tingin sa ${match[1]}`;
    else if ((match = /^Current cover for (.+)$/.exec(trimmed))) translated = `Kasalukuyang pabalat para sa ${match[1]}`;
    else if ((match = /^Show (.+) passwords?$/.exec(trimmed))) translated = `Ipakita ang ${match[1]} na password`;
    else if ((match = /^Hide (.+) passwords?$/.exec(trimmed))) translated = `Itago ang ${match[1]} na password`;
    else if ((match = /^Borrowing history for (.+)$/.exec(trimmed))) translated = `Talaan ng mga hiniram para sa ${match[1]}`;
    else if ((match = /^View borrowing history for (.+)$/.exec(trimmed))) translated = `Tingnan ang talaan ng mga hiniram para sa ${match[1]}`;
    else if ((match = /^Edit (.+)$/.exec(trimmed))) translated = `I-edit ang ${match[1]}`;
    else if ((match = /^Remove (.+)$/.exec(trimmed))) translated = `Alisin ang ${match[1]}`;
    else if ((match = /^Mark (.+) as returned$/.exec(trimmed))) translated = `Markahan ang ${match[1]} bilang naibalik na`;
    else if ((match = /^Sign in as (Admin|Reader)$/.exec(trimmed))) translated = `Mag-sign in bilang ${match[1] === "Reader" ? "Mambabasa" : "Admin"}`;
    else if ((match = /^Forgot (Admin|Reader) password\?$/.exec(trimmed))) translated = `Nakalimutan ang password ng ${match[1] === "Reader" ? "Mambabasa" : "Admin"}?`;
    else if ((match = /^Reset (Admin|Reader) password$/.exec(trimmed))) translated = `I-reset ang password ng ${match[1] === "Reader" ? "Mambabasa" : "Admin"}`;
    else if ((match = /^Enter the library recovery key, then choose a new (Admin|Reader) password\.$/.exec(trimmed))) translated = `Ilagay ang recovery key ng aklatan, saka pumili ng bagong password ng ${match[1] === "Reader" ? "Mambabasa" : "Admin"}.`;
    else if ((match = /^(.+) is back on the shelf!$/.exec(trimmed))) translated = `Naibalik na sa estante ang ${match[1]}!`;
    else if ((match = /^(.+) was removed from the shelf\.$/.exec(trimmed))) translated = `Inalis ang ${match[1]} sa estante.`;
    else if ((match = /^(.+) has been lent to (.+)\.$/.exec(trimmed))) translated = `Ipinahiram ang ${match[1]} kay ${match[2]}.`;
    else if ((match = /^(.+) password updated\. Sign in with your new password\.$/.exec(trimmed))) translated = `Napaltan ang password ng ${match[1]}. Mag-sign in gamit ang bagong password.`;
    else if ((match = /^(\d+)% of (\d+) completed returns were on time; (\d+)% were late\.$/.exec(trimmed))) translated = `${match[1]}% sa ${match[2]} naibalik na aklat ay nasa oras; ${match[3]}% ang nahuli.`;
    else if ((match = /^Based on (\d+) completed returns? with due dates\.$/.exec(trimmed))) translated = `Batay sa ${match[1]} na pagbabalik na may takdang petsa.`;
    else if ((match = /^Based on (\d+) completed returns?; (\d+) records? (?:is|are) missing a usable due date\.$/.exec(trimmed))) translated = `Batay sa ${match[1]} na pagbabalik; walang wastong takdang petsa ang ${match[2]} tala.`;
    else if ((match = /^(\d+) completed returns? needs? a due date before its timing can be shown\.$/.exec(trimmed))) translated = `Kailangan ng takdang petsa ang ${match[1]} pagbabalik bago maipakita kung nahuli ito.`;
  }
  return translated === undefined ? source : `${leading}${translated}${trailing}`;
}

function translateTextNode(node) {
  if (node.parentElement?.closest(".book-title, .book-author, .selected-book, .borrow-details strong, .history-entry-copy strong, .popular-book-copy strong, .due-book-copy strong, .student-reminder-copy strong")) return;
  let state = localizedTextState.get(node);
  if (!state) {
    state = { original: node.nodeValue, translated: null };
    localizedTextState.set(node, state);
  } else if (node.nodeValue !== state.translated) {
    state.original = node.nodeValue;
  }
  const translated = translateUiText(state.original);
  if (node.nodeValue !== translated) node.nodeValue = translated;
  state.translated = translated;
}

function translateElementAttributes(element) {
  for (const name of LOCALIZED_ATTRIBUTES) {
    if (!element.hasAttribute(name)) continue;
    let states = localizedAttributeState.get(element);
    if (!states) {
      states = new Map();
      localizedAttributeState.set(element, states);
    }
    const current = element.getAttribute(name);
    let state = states.get(name);
    if (!state) {
      state = { original: current, translated: null };
      states.set(name, state);
    } else if (current !== state.translated) {
      state.original = current;
    }
    const translated = translateUiText(state.original);
    if (current !== translated) element.setAttribute(name, translated);
    state.translated = translated;
  }
}

function translateSubtree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return;
  if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    else translateElementAttributes(node);
  }
}

const languageObserver = new MutationObserver((records) => {
  records.forEach((record) => {
    if (record.type === "characterData") translateTextNode(record.target);
    if (record.type === "attributes") translateElementAttributes(record.target);
    record.addedNodes?.forEach(translateSubtree);
  });
});

function applyLanguagePreference() {
  document.documentElement.lang = accessibilityPreferences.language === "fil" ? "fil" : "en";
  document.title = accessibilityPreferences.language === "fil" ? "Maliit na Aklatan — Estante ng mga Kuwento" : "Little Library — Story Shelf";
  document.getElementById("languageChoice").value = accessibilityPreferences.language;
  translateSubtree(document.body);
  updateTodayLabel();
}

translateSubtree(document.body);
languageObserver.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: LOCALIZED_ATTRIBUTES });

function dateOffsetFromToday(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const seedBooks = [
  { id: "seed-1", title: "The Very Hungry Caterpillar", author: "Eric Carle", category: "Animals", emoji: "🐛", color: "#dff2d5", available: true },
  { id: "seed-2", title: "Where the Wild Things Are", author: "Maurice Sendak", category: "Adventure", emoji: "🦁", color: "#ffdfb8", available: false, borrowedBy: "Mia Santos", dueDate: dateOffsetFromToday(-2) },
  { id: "seed-3", title: "The Gruffalo", author: "Julia Donaldson", category: "Animals", emoji: "🦊", color: "#ffe8c6", available: true },
  { id: "seed-4", title: "Room on the Broom", author: "Julia Donaldson", category: "Fairy Tales", emoji: "🧙‍♀️", color: "#e5ddff", available: true },
  { id: "seed-5", title: "The Rainbow Fish", author: "Marcus Pfister", category: "Picture Books", emoji: "🐠", color: "#d8efff", available: true },
  { id: "seed-6", title: "We're Going on a Bear Hunt", author: "Michael Rosen", category: "Adventure", emoji: "🐻", color: "#f7dfd5", available: false, borrowedBy: "Noah Lee", dueDate: dateOffsetFromToday(3) },
  { id: "seed-7", title: "Goodnight Moon", author: "Margaret Wise Brown", category: "Picture Books", emoji: "🌙", color: "#e5e8ff", available: true },
  { id: "seed-8", title: "The Tiny Seed", author: "Eric Carle", category: "Learning", emoji: "🌱", color: "#ddf1df", available: true }
];

const categoryColors = { "Picture Books": "#f4a5a1", Adventure: "#e9bb57", Animals: "#73c4a1", "Fairy Tales": "#ad9be9", Learning: "#72afe0", Other: "#d1a0bd" };
const categoryEmojis = { "Picture Books": "📚", Adventure: "🧭", Animals: "🐾", "Fairy Tales": "🪄", Learning: "🌟", Other: "🎨" };
let books = [];
let currentRole = null;
let currentFilter = "all";
let currentDueView = "books";
let selectedBookId = null;
let selectedRemoveBookId = null;
let selectedEditBookId = null;
let historyScopeBookId = null;
let coverPreviewObjectUrl = null;
let toastTimeout;
let selectedLoginRole = "reader";
let readerTourStep = 0;
let settingsTourStep = 0;
let recoveryConfigured = false;

const grid = document.getElementById("booksGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

function resetPasswordVisibility() {
  document.querySelectorAll("[data-password-group]").forEach((input) => {
    input.type = "password";
  });
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    setPasswordToggleState(button, false);
  });
  updatePasswordStrength("admin");
  updatePasswordStrength("reader");
  updatePasswordStrength("recovery");
  updatePasswordStrength("adminChange");
  updatePasswordStrength("readerChange");
  updatePasswordMatch("admin");
  updatePasswordMatch("reader");
  updatePasswordMatch("recovery");
  updatePasswordMatch("adminChange");
  updatePasswordMatch("readerChange");
  updateAccountSetupChecklist();
}

function setPasswordToggleState(button, isVisible) {
  button.innerHTML = passwordEyeIcon;
  button.dataset.visible = String(isVisible);
  button.setAttribute("aria-label", `${isVisible ? "Hide" : "Show"} ${button.dataset.passwordLabel}`);
  button.setAttribute("aria-pressed", String(isVisible));
}

function applyAccessibilityPreferences() {
  applyLanguagePreference();
  document.documentElement.dataset.colorTheme = accessibilityPreferences.colorTheme;
  document.documentElement.classList.toggle("dark-mode", accessibilityPreferences.theme === "dark");
  document.documentElement.classList.toggle("large-text-mode", accessibilityPreferences.textSize !== "normal");
  document.documentElement.classList.toggle("extra-large-text-mode", accessibilityPreferences.textSize === "extra-large");
  document.documentElement.classList.toggle("high-contrast-mode", accessibilityPreferences.highContrast);
  document.querySelector(`input[name="themeMode"][value="${accessibilityPreferences.theme}"]`).checked = true;
  document.querySelector(`input[name="colorTheme"][value="${accessibilityPreferences.colorTheme}"]`).checked = true;
  document.querySelector(`input[name="textSize"][value="${accessibilityPreferences.textSize}"]`).checked = true;
  document.getElementById("highContrastToggle").checked = accessibilityPreferences.highContrast;
  document.querySelector('meta[name="theme-color"]').content = accessibilityPreferences.theme === "dark"
    ? accessibilityPreferences.highContrast ? "#080912" : "#171827"
    : accessibilityPreferences.highContrast ? "#ffffff" : "#fff9ec";
}

function saveAccessibilityPreferences() {
  const textSize = document.querySelector('input[name="textSize"]:checked').value;
  accessibilityPreferences = {
    theme: document.querySelector('input[name="themeMode"]:checked').value,
    colorTheme: document.querySelector('input[name="colorTheme"]:checked').value,
    textSize,
    language: document.getElementById("languageChoice").value,
    largerText: textSize !== "normal",
    highContrast: document.getElementById("highContrastToggle").checked
  };
  applyAccessibilityPreferences();
  const status = document.getElementById("accessibilitySettingsStatus");
  try {
    localStorage.setItem(ACCESSIBILITY_PREFERENCES_KEY, JSON.stringify(accessibilityPreferences));
    status.textContent = "Saved here. You can change it anytime.";
  } catch {
    status.textContent = "Your choices work, but this browser can't save them.";
  }
}

function openAccessibilitySettings() {
  applyAccessibilityPreferences();
  document.getElementById("accessibilitySettingsStatus").textContent = "Changes show right away and save here.";
  openModal(document.getElementById("accessibilitySettingsModal"));
  document.querySelector('input[name="themeMode"]:checked').focus({ preventScroll: true });
}

function updatePasswordStrength(role) {
  const password = document.getElementById(`${role}Password`).value;
  const length = password.length;
  let level = 0;
  let message = "Enter a password to check its strength.";
  if (length > 0 && length < 6) {
    level = 1;
    message = "Almost there — use at least 6 characters.";
  } else if (length < 8 && length >= 6) {
    level = 2;
    message = "Good start! A longer password is stronger.";
  } else if (length < 12 && length >= 8) {
    level = 3;
    message = "Nice and strong!";
  } else if (length >= 12) {
    level = 4;
    message = "Super strong!";
  }

  const meter = document.getElementById(`${role}PasswordStrengthMeter`);
  meter.parentElement.dataset.strength = level;
  meter.setAttribute("aria-valuenow", String(level));
  meter.setAttribute("aria-valuetext", message);
  document.getElementById(`${role}PasswordStrengthText`).textContent = message;
}

function updatePasswordMatch(role) {
  const labels = { admin: "Admin", reader: "Reader", recovery: "Recovery", adminChange: "Admin", readerChange: "Reader" };
  const label = labels[role] || "Recovery";
  const password = document.getElementById(`${role}Password`).value;
  const confirmations = { adminChange: "confirmAdminChangePassword", readerChange: "confirmReaderChangePassword" };
  const confirmationId = confirmations[role] || `confirm${label}Password`;
  const confirmation = document.getElementById(confirmationId).value;
  let state = "waiting";
  let message = "Repeat the password to check it matches.";
  if (password && !confirmation) {
    message = "Type it again to check for a match.";
  } else if (!password && confirmation) {
    message = `Enter the ${label} password first.`;
  } else if (password && confirmation && password === confirmation) {
    state = "match";
    message = "The passwords match!";
  } else if (password && confirmation) {
    state = "mismatch";
    message = "The passwords do not match yet.";
  }

  const indicator = document.getElementById(`${role}PasswordMatch`);
  indicator.dataset.state = state;
  indicator.textContent = message;
}

function updateAccountSetupChecklist() {
  const roles = [
    { name: "admin", label: "Admin" },
    { name: "reader", label: "Reader" }
  ];
  let completed = 0;
  let nextStepLabel = "";

  roles.forEach(({ name, label }, index) => {
    const password = document.getElementById(`${name}Password`).value;
    const confirmation = document.getElementById(`confirm${label}Password`).value;
    const ready = password.length >= 6 && password.trim().length > 0 && password === confirmation;
    const started = Boolean(password || confirmation);
    const step = document.querySelector(`[data-setup-step="${name}"]`);
    const stepNumber = step.querySelector(".setup-step-number");
    const stepState = document.getElementById(`${name}SetupStepState`);

    step.dataset.complete = String(ready);
    stepNumber.textContent = ready ? "✓" : String(index + 1);
    stepState.textContent = ready ? "Done" : started ? "In progress" : "To do";
    if (ready) completed += 1;
    else if (!nextStepLabel) nextStepLabel = label;
  });

  const progressText = document.getElementById("setupChecklistProgressText");
  const progress = document.getElementById("setupChecklistProgress");
  const progressBar = document.getElementById("setupChecklistProgressBar");
  const message = document.getElementById("setupChecklistMessage");
  const setupFields = document.getElementById("setupFields");
  progressText.textContent = `${completed} of 2 steps complete`;
  progress.setAttribute("aria-valuenow", String(completed));
  progressBar.style.width = `${completed * 50}%`;
  message.textContent = completed === 2
    ? "Both accounts are ready! You can start your library."
    : `Complete the ${nextStepLabel} account step to continue.`;
  document.getElementById("authSubmitButton").disabled = !setupFields.hidden && completed < 2;
}

function loadLegacyBooks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedBooks;
  } catch {
    return seedBooks;
  }
}

async function api(path, options = {}) {
  const request = {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: options.body === undefined ? {} : { "Content-Type": "application/json" }
  };
  if (options.body !== undefined) request.body = JSON.stringify(options.body);
  let response;
  try {
    response = await fetch(path, request);
  } catch {
    throw new Error("The local library server could not be reached.");
  }
  let result = {};
  try { result = await response.json(); } catch { /* The server may return an empty response. */ }
  if (!response.ok) {
    if (response.status === 401 && result.error === "Please sign in again.") lockApp();
    throw new Error(result.error || "That library action could not be completed.");
  }
  return result;
}

function setAuthMode(mode) {
  const isSetup = mode === "setup";
  const authModal = document.getElementById("authModal");
  const loginFields = document.getElementById("loginFields");
  const setupFields = document.getElementById("setupFields");
  loginFields.hidden = isSetup;
  setupFields.hidden = !isSetup;
  loginFields.querySelectorAll("input").forEach((input) => { input.disabled = isSetup; });
  setupFields.querySelectorAll("input").forEach((input) => { input.disabled = !isSetup; });
  document.getElementById("authKicker").textContent = isSetup ? "A NEW LIBRARY ADVENTURE" : "WELCOME BACK";
  document.getElementById("authTitle").textContent = isSetup ? "Set up your library" : "Sign in to your library";
  document.getElementById("authDescription").textContent = isSetup
    ? "Choose passwords for the Admin and shared Reader accounts."
    : "Choose your role and enter its password.";
  document.getElementById("authSubmitButton").textContent = isSetup ? "Create passwords and start" : `Sign in as ${selectedLoginRole === "admin" ? "Admin" : "Reader"}`;
  document.getElementById("authError").textContent = "";
  document.getElementById("authForm").reset();
  resetPasswordVisibility();
  updateLoginRole(selectedLoginRole);
  if (!authModal.open) openModal(authModal);
}

function updateLoginRole(role) {
  selectedLoginRole = role === "admin" ? "admin" : "reader";
  document.querySelectorAll("[data-auth-role]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.authRole === selectedLoginRole));
  });
  const button = document.getElementById("authSubmitButton");
  if (!document.getElementById("setupFields").hidden) return;
  button.textContent = `Sign in as ${selectedLoginRole === "admin" ? "Admin" : "Reader"}`;
  document.getElementById("forgotPasswordButton").textContent = `Forgot ${selectedLoginRole === "admin" ? "Admin" : "Reader"} password?`;
}

function showLibrary(session) {
  currentRole = session.role;
  recoveryConfigured = Boolean(session.recoveryConfigured || session.recoveryCode);
  books = Array.isArray(session.books) ? session.books : [];
  document.getElementById("authForm").reset();
  resetPasswordVisibility();
  document.body.classList.remove("auth-locked");
  closeModal(document.getElementById("authModal"));
  render();
  if (currentRole === "admin" && session.recoveryCode) showRecoveryKey(session.recoveryCode);
  if (currentRole === "reader" && !hasSeenReaderTour()) openReaderTour();
}

function showPasswordRecovery() {
  const roleLabel = selectedLoginRole === "admin" ? "Admin" : "Reader";
  document.getElementById("recoveryResetTitle").textContent = `Reset ${roleLabel} password`;
  document.getElementById("recoveryResetDescription").textContent = `Enter the library recovery key, then choose a new ${roleLabel} password.`;
  document.getElementById("recoveryResetError").textContent = "";
  document.getElementById("recoveryResetForm").reset();
  resetPasswordVisibility();
  openModal(document.getElementById("recoveryResetModal"));
  document.getElementById("recoveryCodeInput").focus();
}

function openRecoveryKeyManager() {
  if (currentRole !== "admin") return;
  document.getElementById("recoveryKeyPrompt").hidden = false;
  document.getElementById("recoveryKeyReveal").hidden = true;
  document.getElementById("recoveryKeyError").textContent = "";
  document.getElementById("recoveryKeyTitle").textContent = recoveryConfigured ? "Replace the recovery key?" : "Set up account recovery";
  document.getElementById("recoveryKeyPromptText").textContent = recoveryConfigured
    ? "A new key will replace the old one. Save the new key somewhere private so you can reset either password."
    : "Create a private key that can reset either library password. Save it somewhere safe. It will only be shown once.";
  document.getElementById("recoveryKeyConfirm").textContent = recoveryConfigured ? "Replace recovery key" : "Create recovery key";
  openModal(document.getElementById("recoveryKeyModal"));
  document.getElementById("recoveryKeyConfirm").focus();
}

function openAccountPasswords() {
  if (currentRole !== "admin") return;
  document.getElementById("adminPasswordChangeForm").reset();
  document.getElementById("readerPasswordChangeForm").reset();
  document.getElementById("adminPasswordChangeError").textContent = "";
  document.getElementById("readerPasswordChangeError").textContent = "";
  document.getElementById("adminPasswordChangeStatus").textContent = "";
  document.getElementById("readerPasswordChangeStatus").textContent = "";
  resetPasswordVisibility();
  openModal(document.getElementById("accountPasswordsModal"));
  document.getElementById("currentAdminPassword").focus();
}

function showRecoveryKey(code) {
  document.getElementById("recoveryKeyPrompt").hidden = true;
  document.getElementById("recoveryKeyReveal").hidden = false;
  document.getElementById("recoveryKeyTitle").textContent = "Save this recovery key";
  document.getElementById("recoveryKeyValue").value = code;
  document.getElementById("recoveryCopyStatus").textContent = "";
  const dialog = document.getElementById("recoveryKeyModal");
  if (!dialog.open) openModal(dialog);
  document.getElementById("recoveryKeyValue").focus();
  document.getElementById("recoveryKeyValue").select();
}

function hasSeenReaderTour() {
  try { return localStorage.getItem(READER_TOUR_SEEN_KEY) === "true"; }
  catch { return false; }
}

function updateReaderTourStep(step, focusHeading = true) {
  const slides = [...document.querySelectorAll("[data-reader-tour-step]")];
  readerTourStep = Math.max(0, Math.min(step, slides.length - 1));
  slides.forEach((slide, index) => { slide.hidden = index !== readerTourStep; });

  const stepNumber = readerTourStep + 1;
  document.getElementById("readerTourStepLabel").textContent = `Step ${stepNumber} of ${slides.length}`;
  document.getElementById("readerTourProgress").setAttribute("aria-valuenow", String(stepNumber));
  document.getElementById("readerTourProgressBar").style.width = `${stepNumber / slides.length * 100}%`;
  document.getElementById("readerTourBack").hidden = readerTourStep === 0;
  document.getElementById("readerTourSkip").hidden = readerTourStep === slides.length - 1;
  document.getElementById("readerTourNext").hidden = readerTourStep === slides.length - 1;
  document.getElementById("readerTourFinish").hidden = readerTourStep !== slides.length - 1;

  if (focusHeading) slides[readerTourStep].querySelector("h3").focus();
}

function openReaderTour() {
  if (currentRole !== "reader") return;
  try { localStorage.setItem(READER_TOUR_SEEN_KEY, "true"); } catch { /* The tour remains available from its library button. */ }
  updateReaderTourStep(0, false);
  openModal(document.getElementById("readerTourModal"));
  document.getElementById("readerTourTitle").focus();
}

function updateSettingsTourStep(step, focusHeading = true) {
  const slides = [...document.querySelectorAll("[data-settings-tour-step]")];
  settingsTourStep = Math.max(0, Math.min(step, slides.length - 1));
  slides.forEach((slide, index) => { slide.hidden = index !== settingsTourStep; });

  const stepNumber = settingsTourStep + 1;
  document.getElementById("settingsTourStepLabel").textContent = `Step ${stepNumber} of ${slides.length}`;
  document.getElementById("settingsTourProgress").setAttribute("aria-valuenow", String(stepNumber));
  document.getElementById("settingsTourProgressBar").style.width = `${stepNumber / slides.length * 100}%`;
  document.getElementById("settingsTourBack").hidden = settingsTourStep === 0;
  document.getElementById("settingsTourSkip").hidden = settingsTourStep === slides.length - 1;
  document.getElementById("settingsTourNext").hidden = settingsTourStep === slides.length - 1;
  document.getElementById("settingsTourFinish").hidden = settingsTourStep !== slides.length - 1;

  if (focusHeading) slides[settingsTourStep].querySelector("h3").focus();
}

function updateSettingsTourTextPreview(size) {
  const previewSize = ["normal", "large", "extra-large"].includes(size) ? size : "normal";
  document.querySelectorAll("[data-settings-tour-text-size]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.settingsTourTextSize === previewSize));
  });
  document.getElementById("settingsTourTextSample").dataset.textSize = previewSize;
}

function openSettingsTour() {
  updateSettingsTourTextPreview(accessibilityPreferences.textSize);
  updateSettingsTourStep(0, false);
  openModal(document.getElementById("readingSettingsTourModal"));
  document.getElementById("settingsTourTitle").focus();
}

function lockApp() {
  document.querySelectorAll("dialog[open]").forEach(closeModal);
  selectedBookId = null;
  selectedEditBookId = null;
  selectedRemoveBookId = null;
  historyScopeBookId = null;
  currentFilter = "all";
  currentDueView = "books";
  searchInput.value = "";
  currentRole = null;
  books = [];
  clearAdminViewData();
  document.getElementById("bookForm").reset();
  document.getElementById("borrowForm").reset();
  document.getElementById("adminPasswordChangeForm").reset();
  document.getElementById("readerPasswordChangeForm").reset();
  resetCoverUpload();
  renderRoleControls();
  document.body.classList.add("auth-locked");
  setAuthMode("login");
}

async function initializeApp() {
  try {
    const session = await api("/api/session");
    if (session.setupRequired) {
      setAuthMode("setup");
    } else if (session.authenticated) {
      showLibrary(session);
    } else {
      setAuthMode("login");
    }
  } catch (error) {
    setAuthMode("login");
    document.getElementById("authError").textContent = error.message;
  }
}

function formatDueDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(currentLocale(), { month: "short", day: "numeric" }).format(date);
}

function formatHistoryDate(dateString) {
  if (!dateString) return "Date not recorded";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return new Intl.DateTimeFormat(currentLocale(), { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function historyDateKey(dateString) {
  const date = new Date(dateString || "");
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLoanHistoryRecords() {
  return books.flatMap((book) => {
    const completed = Array.isArray(book.history) ? book.history : [];
    const active = !book.available
      ? [{ student: book.borrowedBy, borrowedAt: book.borrowedAt, dueDate: book.dueDate, returnedAt: "" }]
      : [];
    return [
      ...active.map((record) => ({ book, record, isCurrent: true })),
      ...completed.map((record) => ({ book, record, isCurrent: false }))
    ];
  }).sort((a, b) => {
    const aTime = Date.parse(a.record.borrowedAt || a.record.returnedAt || "") || 0;
    const bTime = Date.parse(b.record.borrowedAt || b.record.returnedAt || "") || 0;
    return bTime - aTime;
  });
}

function getLoanHistoryStatus(record, isCurrent) {
  if (!isCurrent) return "returned";
  const days = record.dueDate ? daysFromToday(record.dueDate) : null;
  return days !== null && days < 0 ? "overdue" : "borrowed";
}

function renderHistoryList() {
  if (currentRole !== "admin") return;
  const studentFilter = document.getElementById("historyStudentFilter").value.trim().toLocaleLowerCase();
  const bookFilter = document.getElementById("historyBookFilter").value.trim().toLocaleLowerCase();
  const fromDate = document.getElementById("historyFromDate").value;
  const toDate = document.getElementById("historyToDate").value;
  const statusFilter = document.getElementById("historyStatusFilter").value;
  const invalidRange = fromDate && toDate && fromDate > toDate;
  const matchingRecords = invalidRange ? [] : getLoanHistoryRecords().filter(({ book, record }) => {
    if (historyScopeBookId && book.id !== historyScopeBookId) return false;
    const student = String(record.student || "").trim().toLocaleLowerCase();
    if (studentFilter && !student.includes(studentFilter)) return false;
    const title = String(book.title || "").trim().toLocaleLowerCase();
    if (bookFilter && !title.includes(bookFilter)) return false;
    const borrowedDate = historyDateKey(record.borrowedAt);
    if (fromDate && (!borrowedDate || borrowedDate < fromDate)) return false;
    if (toDate && (!borrowedDate || borrowedDate > toDate)) return false;
    return true;
  });
  const statusCounts = { returned: 0, borrowed: 0, overdue: 0 };
  matchingRecords.forEach(({ record, isCurrent }) => {
    statusCounts[getLoanHistoryStatus(record, isCurrent)] += 1;
  });
  document.getElementById("historyReturnedCount").textContent = statusCounts.returned;
  document.getElementById("historyBorrowedCount").textContent = statusCounts.borrowed;
  document.getElementById("historyOverdueCount").textContent = statusCounts.overdue;
  document.querySelectorAll("[data-history-status]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.historyStatus === statusFilter));
  });
  const records = statusFilter
    ? matchingRecords.filter(({ record, isCurrent }) => getLoanHistoryStatus(record, isCurrent) === statusFilter)
    : matchingRecords;

  const resultCount = document.getElementById("historyResultCount");
  const historyList = document.getElementById("historyList");
  if (invalidRange) {
    resultCount.textContent = "Choose a start date on or before the end date.";
    historyList.innerHTML = `<li class="history-empty">The date range needs a quick check.</li>`;
    return;
  }

  const hasFilters = Boolean(studentFilter || bookFilter || fromDate || toDate || statusFilter);
  resultCount.textContent = `${records.length} ${records.length === 1 ? "loan" : "loans"} found`;
  if (!records.length) {
    const emptyText = hasFilters
      ? "No loans match these filters. Try another book title, student, or date range."
      : historyScopeBookId
        ? "No borrowing records for this book yet."
        : "No borrowing records in this library yet.";
    historyList.innerHTML = `<li class="history-empty">${emptyText}</li>`;
    return;
  }

  historyList.innerHTML = records.map(({ book, record, isCurrent }) => {
    const loanStatus = getLoanHistoryStatus(record, isCurrent);
    const overdue = loanStatus === "overdue";
    const status = loanStatus === "returned" ? "Returned" : overdue ? "Overdue" : "Reading now";
    const statusClass = loanStatus === "returned" ? "is-returned" : overdue ? "is-overdue" : "";
    const entryClass = isCurrent ? ` is-current${overdue ? " is-overdue" : ""}` : "";
    const dueText = record.dueDate ? `Due back ${formatDueDate(record.dueDate)}` : "Due date not recorded";
    const returnedText = isCurrent ? "" : ` · Returned ${formatHistoryDate(record.returnedAt)}`;
    return `<li class="history-entry${entryClass}">
      <span class="history-entry-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
      <span class="history-entry-copy"><strong>${escapeHtml(record.student || "Student name not recorded")} · ${escapeHtml(book.title)}</strong><span>Borrowed ${formatHistoryDate(record.borrowedAt)} · ${dueText}${returnedText}</span></span>
      <span class="history-status ${statusClass}">${status}</span>
    </li>`;
  }).join("");
}

function openHistoryModal(bookId = null) {
  if (currentRole !== "admin") return;
  const book = bookId ? books.find((item) => item.id === bookId) : null;
  if (bookId && !book) return;
  historyScopeBookId = book ? book.id : null;
  document.getElementById("historyModalTitle").textContent = book ? "Book borrowing history" : "Library borrowing history";
  document.getElementById("historyBookTitle").textContent = book ? `📖  ${book.title}` : "All books in our library";
  document.getElementById("historyStudentFilter").value = "";
  document.getElementById("historyBookFilter").value = "";
  document.getElementById("historyFromDate").value = "";
  document.getElementById("historyToDate").value = "";
  document.getElementById("historyStatusFilter").value = "";
  renderHistoryList();
  openModal(document.getElementById("historyModal"));
  document.getElementById("historyStudentFilter").focus();
}

function getVisibleBooks() {
  const search = searchInput.value.trim().toLowerCase();
  return books.filter((book) => {
    const statusFilter = ["all", "available", "borrowed", "overdue"].includes(currentFilter);
    const matchesFilter = currentFilter === "all"
      || currentFilter === "available" && book.available
      || currentFilter === "borrowed" && !book.available
      || currentRole === "admin" && currentFilter === "overdue" && isOverdue(book)
      || !statusFilter && book.category === currentFilter;
    const matchesSearch = !search || `${book.title} ${book.author || ""} ${book.category}`.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });
}

function render() {
  const available = books.filter((book) => book.available).length;
  const borrowed = books.length - available;
  const overdue = currentRole === "admin" ? books.filter(isOverdue).length : 0;
  document.getElementById("allCount").textContent = books.length;
  document.getElementById("availableCount").textContent = available;
  document.getElementById("borrowedCount").textContent = borrowed;
  document.getElementById("overdueNavCount").textContent = overdue;
  document.getElementById("totalStat").textContent = books.length;
  document.getElementById("availableStat").textContent = available;
  document.getElementById("borrowedStat").textContent = borrowed;
  renderRoleControls();
  if (currentRole === "admin") {
    renderInsights();
    renderDueDates();
  } else {
    clearAdminViewData();
  }

  const visible = getVisibleBooks();
  document.getElementById("visibleCount").textContent = visible.length;
  grid.innerHTML = visible.map(bookCard).join("");
  emptyState.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  renderCategories();
  renderFilterName();
}

function clearAdminViewData() {
  ["mostBorrowedBooks", "overdueList", "dueSoonList", "studentReminderGroups", "historyList"].forEach((id) => {
    document.getElementById(id).replaceChildren();
  });
  ["totalLoanCount", "overdueCount", "dueSoonCount", "studentReminderCount", "historyReturnedCount", "historyBorrowedCount", "historyOverdueCount", "onTimeReturnCount", "lateReturnCount"].forEach((id) => {
    document.getElementById(id).textContent = "0";
  });
  document.getElementById("totalLoanCount").textContent = "0 loans";
  ["totalStat", "availableStat", "borrowedStat", "overdueNavCount"].forEach((id) => {
    document.getElementById(id).textContent = "0";
  });
  ["historyBookTitle", "historyResultCount", "removeBookName"].forEach((id) => {
    document.getElementById(id).textContent = "";
  });
  ["historyStudentFilter", "historyBookFilter", "historyFromDate", "historyToDate"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("historyStatusFilter").value = "";
  document.getElementById("returnPatternNote").textContent = "Completed returns with due dates will show here.";
  document.getElementById("returnPatternBar").setAttribute("aria-label", "No return data yet");
  document.querySelectorAll(".return-pattern-bar > span").forEach((segment) => { segment.style.width = "0%"; });
}

function renderInsights() {
  if (currentRole !== "admin") return;
  const completedReturns = books.flatMap((book) =>
    (Array.isArray(book.history) ? book.history : []).map((record) => ({ ...record }))
  );
  const returnStats = { onTime: 0, late: 0 };
  let excludedReturns = 0;

  completedReturns.forEach((record) => {
    const dueMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(record.dueDate || "");
    const returnedAt = new Date(record.returnedAt || "");
    if (!dueMatch || Number.isNaN(returnedAt.getTime())) {
      excludedReturns += 1;
      return;
    }

    const dueYear = Number(dueMatch[1]);
    const dueMonth = Number(dueMatch[2]) - 1;
    const dueDay = Number(dueMatch[3]);
    const dueDate = new Date(dueYear, dueMonth, dueDay);
    if (dueDate.getFullYear() !== dueYear || dueDate.getMonth() !== dueMonth || dueDate.getDate() !== dueDay) {
      excludedReturns += 1;
      return;
    }

    const dueDayNumber = Date.UTC(dueYear, dueMonth, dueDay);
    const returnedDayNumber = Date.UTC(returnedAt.getFullYear(), returnedAt.getMonth(), returnedAt.getDate());
    if (returnedDayNumber <= dueDayNumber) returnStats.onTime += 1;
    else returnStats.late += 1;
  });

  const popularBooks = books.map((book) => ({
    book,
    count: (Array.isArray(book.history) ? book.history.length : 0) + (book.available ? 0 : 1)
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count || a.book.title.localeCompare(b.book.title));
  const totalLoans = popularBooks.reduce((sum, item) => sum + item.count, 0);
  const maxLoans = popularBooks.length ? popularBooks[0].count : 0;
  document.getElementById("totalLoanCount").textContent = `${totalLoans} ${totalLoans === 1 ? "loan" : "loans"}`;
  document.getElementById("mostBorrowedBooks").innerHTML = popularBooks.length
    ? popularBooks.slice(0, 5).map(({ book, count }, index) => {
      const barWidth = Math.round(count / maxLoans * 100);
      return `<li class="popular-book-row">
        <span class="popular-rank" aria-hidden="true">${index + 1}</span>
        <span class="popular-book-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
        <span class="popular-book-copy"><strong title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</strong><span>${escapeHtml(book.author || "Author not added")}</span><span class="popular-meter" aria-hidden="true"><span style="width:${barWidth}%"></span></span></span>
        <span class="popular-count"><strong>${count}</strong><small>${count === 1 ? "loan" : "loans"}</small></span>
      </li>`;
    }).join("")
    : `<li class="popular-empty">Borrow a book to start our reader favorites list.</li>`;

  const totalReturns = returnStats.onTime + returnStats.late;
  const onTimePercent = totalReturns ? Math.round(returnStats.onTime / totalReturns * 100) : 0;
  document.getElementById("onTimeReturnCount").textContent = returnStats.onTime;
  document.getElementById("lateReturnCount").textContent = returnStats.late;
  document.getElementById("onTimeReturnSegment").style.width = `${onTimePercent}%`;
  document.getElementById("lateReturnSegment").style.width = `${totalReturns ? 100 - onTimePercent : 0}%`;
  document.getElementById("returnPatternBar").setAttribute("aria-label", totalReturns
    ? `${onTimePercent}% of ${totalReturns} completed returns were on time; ${100 - onTimePercent}% were late.`
    : "No completed returns with due dates yet");

  const note = totalReturns
    ? `Based on ${totalReturns} completed ${totalReturns === 1 ? "return" : "returns"}${excludedReturns ? `; ${excludedReturns} ${excludedReturns === 1 ? "record is" : "records are"} missing a usable due date` : " with due dates"}.`
    : excludedReturns
      ? `${excludedReturns} completed ${excludedReturns === 1 ? "return needs" : "returns need"} a due date before its timing can be shown.`
      : "Completed returns with due dates will show here.";
  document.getElementById("returnPatternNote").textContent = note;
}

function daysFromToday(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dueTime = Date.UTC(year, month - 1, day);
  const today = new Date();
  const todayTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((dueTime - todayTime) / 86400000);
}

function isOverdue(book) {
  if (book.available || !book.dueDate) return false;
  const days = daysFromToday(book.dueDate);
  return days !== null && days < 0;
}

function dueLabel(days) {
  if (days < 0) {
    const lateDays = Math.abs(days);
    return `${lateDays} ${lateDays === 1 ? "day" : "days"} overdue`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function renderDueList(listId, items, emptyText) {
  const list = document.getElementById(listId);
  if (!items.length) {
    list.innerHTML = `<li class="due-empty">${emptyText}</li>`;
    return;
  }
  list.innerHTML = items.map(({ book, days }) => `
    <li class="due-book-row">
      <span class="due-book-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
      <span class="due-book-copy"><strong>${escapeHtml(book.title)}</strong><span>With ${escapeHtml(book.borrowedBy || "a student")}</span></span>
      <span class="due-date-pill">${dueLabel(days)}</span>
    </li>`).join("");
}

function renderDueDates() {
  if (currentRole !== "admin") return;
  const datedBorrowedBooks = books
    .filter((book) => !book.available && book.dueDate)
    .map((book) => ({ book, days: daysFromToday(book.dueDate) }))
    .filter((item) => item.days !== null);
  const overdue = datedBorrowedBooks.filter((item) => item.days < 0).sort((a, b) => a.days - b.days);
  const dueSoon = datedBorrowedBooks.filter((item) => item.days >= 0 && item.days <= 7).sort((a, b) => a.days - b.days);
  document.getElementById("overdueCount").textContent = overdue.length;
  document.getElementById("dueSoonCount").textContent = dueSoon.length;
  renderDueList("overdueList", overdue, "No overdue books. Hooray!");
  renderDueList("dueSoonList", dueSoon, "No books due in the next 7 days.");
  renderStudentReminders(overdue);
}

function renderStudentReminders(overdue) {
  const groupsByStudent = new Map();
  overdue.forEach((item) => {
    const name = String(item.book.borrowedBy || "").trim();
    const key = name ? name.toLocaleLowerCase() : "__student_name_missing__";
    if (!groupsByStudent.has(key)) {
      groupsByStudent.set(key, { name: name || "Student name not recorded", books: [] });
    }
    groupsByStudent.get(key).books.push(item);
  });

  const groups = [...groupsByStudent.values()];
  groups.forEach((group) => group.books.sort((a, b) => a.days - b.days));
  groups.sort((a, b) => {
    const latenessDifference = a.books[0].days - b.books[0].days;
    return latenessDifference || a.name.localeCompare(b.name);
  });

  document.getElementById("studentReminderCount").textContent = groups.length;
  document.getElementById("studentReminderGroups").innerHTML = groups.length
    ? groups.map((group) => {
      const countLabel = `${group.books.length} ${group.books.length === 1 ? "book" : "books"} overdue`;
      const overdueBooks = group.books.map(({ book, days }) => `
        <li class="student-reminder-book">
          <span class="student-reminder-book-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
          <strong title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</strong>
          <span class="student-reminder-late">${dueLabel(days)}</span>
        </li>`).join("");
      return `<article class="student-reminder-card">
        <div class="student-reminder-heading">
          <span class="student-reminder-avatar" aria-hidden="true">🧑‍🎓</span>
          <div class="student-reminder-copy"><strong title="${escapeHtml(group.name)}">${escapeHtml(group.name)}</strong><span>${countLabel}</span></div>
          <span class="student-reminder-badge">${group.books.length}</span>
        </div>
        <ul class="student-reminder-books">${overdueBooks}</ul>
      </article>`;
    }).join("")
    : `<div class="student-reminder-empty">No student reminders right now. Hooray!</div>`;
  setDueView(currentDueView);
}

function setDueView(view) {
  if (currentRole !== "admin") return;
  currentDueView = view === "students" ? "students" : "books";
  const isStudentView = currentDueView === "students";
  document.getElementById("dueBooksTab").classList.toggle("active", !isStudentView);
  document.getElementById("studentRemindersTab").classList.toggle("active", isStudentView);
  document.getElementById("dueBooksTab").setAttribute("aria-pressed", String(!isStudentView));
  document.getElementById("studentRemindersTab").setAttribute("aria-pressed", String(isStudentView));
  document.getElementById("dueBooksView").hidden = isStudentView;
  document.getElementById("studentRemindersView").hidden = !isStudentView;
  document.getElementById("dueWindowLabel").textContent = isStudentView ? "Past due" : "Next 7 days";
}

function renderRoleControls() {
  const isAdmin = currentRole === "admin";
  if (currentRole) document.body.dataset.role = currentRole;
  else delete document.body.dataset.role;
  document.querySelectorAll("[data-admin-only]").forEach((element) => { element.hidden = !isAdmin; });
  document.getElementById("currentRoleName").textContent = isAdmin ? "Admin" : "Reader";
  document.getElementById("roleIcon").innerHTML = isAdmin ? adminRoleIcon : "📖";
  document.querySelector(".role-switch-destination").textContent = "Sign out";
  document.getElementById("logoutButton").setAttribute("aria-label", `Sign out from ${isAdmin ? "Admin" : "Reader"} account`);
  document.getElementById("openAddBook").hidden = !isAdmin;
  document.getElementById("readerTourButton").hidden = isAdmin;
  const recoveryButton = document.getElementById("manageRecoveryButton");
  recoveryButton.hidden = !isAdmin;
  recoveryButton.innerHTML = `<span aria-hidden="true">🔐</span><span>${recoveryConfigured ? "Replace recovery key" : "Set up recovery key"}</span>`;
  document.getElementById("manageAccountPasswordsButton").hidden = !isAdmin;
}

function bookCard(book) {
  const borrowed = !book.available;
  const history = Array.isArray(book.history) ? book.history : [];
  const due = formatDueDate(book.dueDate);
  const overdueDays = borrowed && book.dueDate ? daysFromToday(book.dueDate) : null;
  const isLate = currentRole === "admin" && overdueDays !== null && overdueDays < 0;
  const cover = book.coverImage
    ? `<img class="cover-image" src="${book.coverImage}" alt="Cover of ${escapeHtml(book.title)}" />`
    : `<span class="cover-ribbon">A GOOD STORY</span><span class="cover-emoji" aria-hidden="true">${book.emoji || "📖"}</span>`;
  const borrowInfo = borrowed
    ? currentRole === "admin"
      ? `<div class="borrow-details">Reading with <strong>${escapeHtml(book.borrowedBy || "A friend")}</strong>${isLate ? ` · ${dueLabel(overdueDays)}` : due ? ` · Back by ${escapeHtml(due)}` : ""}</div>`
      : `<div class="borrow-details">${due ? `Back by ${escapeHtml(due)}` : "Currently borrowed"}</div>`
    : "";
  let action;
  if (currentRole === "admin") {
    const returnAction = borrowed
      ? `<button class="book-action return-action" type="button" data-return="${escapeHtml(book.id)}" aria-label="Mark ${escapeHtml(book.title)} as returned">↩ <span>Mark as returned</span></button>`
      : "";
    action = `<div class="admin-book-actions" data-admin-only><button class="book-action edit-action" type="button" data-edit="${escapeHtml(book.id)}" aria-label="Edit ${escapeHtml(book.title)}">✏️ <span>Edit</span></button><button class="book-action remove-action" type="button" data-remove="${escapeHtml(book.id)}" aria-label="Remove ${escapeHtml(book.title)}">🗑 <span>Remove</span></button>${returnAction}</div>`;
  } else if (borrowed) {
    action = `<div class="reader-borrow-note" role="status"><span aria-hidden="true">📚</span><span>You can borrow it when it returns.</span></div>`;
  } else {
    action = `<button class="book-action" type="button" data-borrow="${escapeHtml(book.id)}">📖 <span>Borrow this book</span></button>`;
  }
  const historyButton = currentRole === "admin"
    ? `<button class="history-button" type="button" data-history="${escapeHtml(book.id)}" data-admin-only aria-label="View borrowing history for ${escapeHtml(book.title)}">🕘 <span>Borrowing history</span> <span>${history.length}</span></button>`
    : "";
  return `<article class="book-card${isLate ? " is-overdue" : ""}">
    <div class="cover-wrap" style="--cover:${safeColor(book.color)}">${cover}<span class="status-pill ${borrowed ? "is-borrowed" : ""}${isLate ? " is-overdue" : ""}"><span class="status-dot"></span>${isLate ? dueLabel(overdueDays) : borrowed ? "Out exploring" : "Ready to read"}</span></div>
    <div class="book-info"><div class="book-category">${escapeHtml(book.category || "Other")}</div><h3 class="book-title">${escapeHtml(book.title)}</h3><p class="book-author">${escapeHtml(book.author || "Author not added")}</p>${borrowInfo}<div class="book-actions">${action}${historyButton}</div></div>
  </article>`;
}

function renderCategories() {
  const counts = new Map();
  books.forEach((book) => counts.set(book.category || "Other", (counts.get(book.category || "Other") || 0) + 1));
  document.getElementById("categoryNav").innerHTML = [...counts.entries()].map(([category, count]) => {
    const selected = currentFilter === category ? " selected" : "";
    return `<button class="category-link${selected}" type="button" data-filter="${escapeHtml(category)}"><span class="category-dot" aria-hidden="true">${categoryEmojis[category] || "📖"}</span>${escapeHtml(category)}<span class="nav-count">${count}</span></button>`;
  }).join("");
}

function renderFilterName() {
  const labels = { all: "All stories", available: "Ready to read", borrowed: "Borrowed out", overdue: "Overdue" };
  const name = labels[currentFilter] || currentFilter;
  document.getElementById("breadcrumbCurrent").textContent = name;
  document.getElementById("booksHeading").textContent = currentFilter === "all"
    ? currentRole === "admin" ? "Manage your shelf" : "Choose a story"
    : name;
  document.getElementById("booksSubheading").textContent = currentFilter === "overdue"
    ? "These books are past their return date."
    : currentRole === "admin"
      ? "Add new books or remove books from the shelf."
      : currentFilter === "borrowed"
        ? "These books are currently with a student."
        : currentFilter === "available"
          ? "Pick a book to borrow and enjoy!"
          : "Find your next favorite adventure!";
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.filter === currentFilter));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function safeColor(color) {
  return /^#[0-9a-f]{3,8}$/i.test(color || "") ? color : "#e6e0ff";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openModal(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function clearCoverPreview() {
  if (coverPreviewObjectUrl) {
    URL.revokeObjectURL(coverPreviewObjectUrl);
    coverPreviewObjectUrl = null;
  }
  const preview = document.getElementById("coverPreview");
  preview.removeAttribute("src");
  preview.alt = "";
  preview.hidden = true;
  document.getElementById("coverPreviewWrap").hidden = true;
  document.getElementById("coverUploadIcon").hidden = false;
}

function showCoverPreview(source, description) {
  const preview = document.getElementById("coverPreview");
  preview.src = source;
  preview.alt = description;
  preview.hidden = false;
  document.getElementById("coverPreviewWrap").hidden = false;
  document.getElementById("coverUploadIcon").hidden = true;
}

function resetCoverUpload() {
  clearCoverPreview();
  document.getElementById("uploadText").innerHTML = "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
}

function closeModal(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function makeId() {
  return `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resizeCover(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that picture."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That picture could not be opened."));
      image.onload = () => {
        const maxSide = 700;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener("click", async (event) => {
  const openLibraryHistoryButton = event.target.closest("#openLibraryHistory");
  if (openLibraryHistoryButton) {
    if (currentRole !== "admin") return;
    openHistoryModal();
    return;
  }
  const dueViewButton = event.target.closest("[data-due-view]");
  if (dueViewButton) {
    setDueView(dueViewButton.dataset.dueView);
    return;
  }
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    if (currentRole !== "admin") return;
    const book = books.find((item) => item.id === editButton.dataset.edit);
    if (!book) return;
    selectedEditBookId = book.id;
    document.getElementById("bookForm").reset();
    clearCoverPreview();
    document.getElementById("bookFormError").textContent = "";
    document.getElementById("bookModalKicker").textContent = "UPDATE THIS STORY";
    document.getElementById("bookModalTitle").textContent = "Edit book details";
    document.getElementById("bookModalDescription").textContent = "Update the details or choose a new cover picture.";
    document.getElementById("bookFormSubmitText").textContent = "Save book changes";
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author || "";
    document.getElementById("bookCategory").value = book.category || "Other";
    document.getElementById("uploadText").innerHTML = book.coverImage
      ? "<strong>Current cover is shown</strong><small>Choose a new picture to replace it</small>"
      : "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
    if (book.coverImage) showCoverPreview(book.coverImage, `Current cover for ${book.title}`);
    openModal(document.getElementById("bookModal"));
    document.getElementById("bookTitle").focus();
    return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    if (currentRole !== "admin") return;
    selectedRemoveBookId = removeButton.dataset.remove;
    const book = books.find((item) => item.id === selectedRemoveBookId);
    if (!book) return;
    document.getElementById("removeBookName").textContent = `📖  ${book.title}`;
    openModal(document.getElementById("removeModal"));
    return;
  }
  const historyButton = event.target.closest("[data-history]");
  if (historyButton) {
    if (currentRole !== "admin") return;
    openHistoryModal(historyButton.dataset.history);
    return;
  }
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    if (filterButton.dataset.filter === "overdue" && currentRole !== "admin") return;
    currentFilter = filterButton.dataset.filter;
    render();
    return;
  }
  const borrowButton = event.target.closest("[data-borrow]");
  if (borrowButton) {
    if (currentRole !== "reader") return;
    selectedBookId = borrowButton.dataset.borrow;
    const book = books.find((item) => item.id === selectedBookId);
    document.getElementById("selectedBookName").textContent = `📖  ${book.title}`;
    document.getElementById("borrowFormError").textContent = "";
    document.getElementById("borrowForm").reset();
    openModal(document.getElementById("borrowModal"));
    document.getElementById("studentName").focus();
    return;
  }
  const returnButton = event.target.closest("[data-return]");
  if (returnButton) {
    if (currentRole !== "admin") return;
    const book = books.find((item) => item.id === returnButton.dataset.return);
    if (!book) return;
    try {
      const result = await api(`/api/books/${encodeURIComponent(book.id)}/return`, { method: "POST" });
      Object.assign(book, result.book);
      render();
      showToast(`${book.title} is back on the shelf!`);
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) closeModal(document.getElementById(closeButton.dataset.close));
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  try { await api("/api/logout", { method: "POST", body: {} }); } catch { /* Clear this page even if the local server stopped. */ }
  lockApp();
  document.getElementById("authError").textContent = "You have signed out. Choose a role to sign back in.";
});

document.getElementById("forgotPasswordButton").addEventListener("click", showPasswordRecovery);
document.getElementById("manageRecoveryButton").addEventListener("click", openRecoveryKeyManager);
document.getElementById("manageAccountPasswordsButton").addEventListener("click", openAccountPasswords);
document.getElementById("recoveryKeyConfirm").addEventListener("click", async () => {
  if (currentRole !== "admin") return;
  const button = document.getElementById("recoveryKeyConfirm");
  const error = document.getElementById("recoveryKeyError");
  button.disabled = true;
  error.textContent = "";
  try {
    const result = await api("/api/recovery-key", { method: "POST", body: {} });
    recoveryConfigured = true;
    renderRoleControls();
    showRecoveryKey(result.recoveryCode);
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
  }
});
document.getElementById("copyRecoveryKey").addEventListener("click", async () => {
  if (currentRole !== "admin") return;
  const input = document.getElementById("recoveryKeyValue");
  const status = document.getElementById("recoveryCopyStatus");
  input.select();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(input.value);
    } else if (!document.execCommand("copy")) {
      throw new Error("Copy failed.");
    }
    status.textContent = "Recovery key copied. Keep it somewhere private.";
  } catch {
    status.textContent = "The key is selected. Copy it and keep it somewhere private.";
  }
});
document.getElementById("recoveryKeyModal").addEventListener("close", () => {
  document.getElementById("recoveryKeyValue").value = "";
  document.getElementById("recoveryCopyStatus").textContent = "";
  if (currentRole === "admin") document.getElementById("manageRecoveryButton").focus();
});
document.getElementById("recoveryResetModal").addEventListener("close", () => {
  document.getElementById("recoveryResetForm").reset();
  document.getElementById("recoveryResetError").textContent = "";
  resetPasswordVisibility();
});
document.getElementById("recoveryResetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const recoveryCode = document.getElementById("recoveryCodeInput").value.trim();
  const newPassword = document.getElementById("recoveryPassword").value;
  const confirmation = document.getElementById("confirmRecoveryPassword").value;
  const error = document.getElementById("recoveryResetError");
  const button = document.getElementById("recoveryResetSubmit");
  const roleLabel = selectedLoginRole === "admin" ? "Admin" : "Reader";
  error.textContent = "";
  if (newPassword.length < 6) {
    error.textContent = "Use at least 6 characters for the new password.";
    return;
  }
  if (newPassword !== confirmation) {
    error.textContent = "The new passwords do not match yet.";
    return;
  }
  button.disabled = true;
  button.textContent = "Updating password...";
  try {
    await api("/api/recover", { method: "POST", body: { role: selectedLoginRole, recoveryCode, newPassword } });
    closeModal(document.getElementById("recoveryResetModal"));
    document.getElementById("loginPassword").value = "";
    document.getElementById("authError").textContent = `${roleLabel} password updated. Sign in with your new password.`;
    document.getElementById("loginPassword").focus();
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
    button.textContent = "Reset password";
  }
});

document.getElementById("accountPasswordsModal").addEventListener("close", () => {
  document.getElementById("adminPasswordChangeForm").reset();
  document.getElementById("readerPasswordChangeForm").reset();
  document.getElementById("adminPasswordChangeError").textContent = "";
  document.getElementById("readerPasswordChangeError").textContent = "";
  document.getElementById("adminPasswordChangeStatus").textContent = "";
  document.getElementById("readerPasswordChangeStatus").textContent = "";
  resetPasswordVisibility();
  if (currentRole === "admin") document.getElementById("manageAccountPasswordsButton").focus();
});
document.getElementById("adminChangePassword").addEventListener("input", () => {
  updatePasswordStrength("adminChange");
  updatePasswordMatch("adminChange");
});
document.getElementById("confirmAdminChangePassword").addEventListener("input", () => updatePasswordMatch("adminChange"));
document.getElementById("readerChangePassword").addEventListener("input", () => {
  updatePasswordStrength("readerChange");
  updatePasswordMatch("readerChange");
});
document.getElementById("confirmReaderChangePassword").addEventListener("input", () => updatePasswordMatch("readerChange"));
document.getElementById("adminPasswordChangeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;
  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("adminChangePassword").value;
  const confirmation = document.getElementById("confirmAdminChangePassword").value;
  const error = document.getElementById("adminPasswordChangeError");
  const status = document.getElementById("adminPasswordChangeStatus");
  const button = document.getElementById("adminPasswordChangeSubmit");
  error.textContent = "";
  status.textContent = "";
  if (newPassword.length < 6) {
    error.textContent = "Use at least 6 characters for the new Admin password.";
    return;
  }
  if (newPassword !== confirmation) {
    error.textContent = "The Admin passwords do not match yet.";
    return;
  }
  button.disabled = true;
  button.textContent = "Updating password...";
  try {
    await api("/api/admin/account-password", { method: "POST", body: { currentPassword, newPassword, confirmation } });
    document.getElementById("adminPasswordChangeForm").reset();
    resetPasswordVisibility();
    status.textContent = "Admin password updated. This session is still signed in.";
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
    button.textContent = "Change Admin password";
  }
});
document.getElementById("readerPasswordChangeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;
  const newPassword = document.getElementById("readerChangePassword").value;
  const confirmation = document.getElementById("confirmReaderChangePassword").value;
  const error = document.getElementById("readerPasswordChangeError");
  const status = document.getElementById("readerPasswordChangeStatus");
  const button = document.getElementById("readerPasswordChangeSubmit");
  error.textContent = "";
  status.textContent = "";
  if (newPassword.length < 6) {
    error.textContent = "Use at least 6 characters for the new Reader password.";
    return;
  }
  if (newPassword !== confirmation) {
    error.textContent = "The Reader passwords do not match yet.";
    return;
  }
  button.disabled = true;
  button.textContent = "Updating password...";
  try {
    await api("/api/admin/reader-password", { method: "POST", body: { newPassword, confirmation } });
    document.getElementById("readerPasswordChangeForm").reset();
    resetPasswordVisibility();
    status.textContent = "Reader password updated. Readers will need to sign in again.";
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
    button.textContent = "Change Reader password";
  }
});

document.getElementById("accessibilitySettingsButton").addEventListener("click", openAccessibilitySettings);
document.getElementById("authAccessibilitySettingsButton").addEventListener("click", openAccessibilitySettings);
document.querySelectorAll('input[name="textSize"]').forEach((input) => input.addEventListener("change", saveAccessibilityPreferences));
document.getElementById("highContrastToggle").addEventListener("change", saveAccessibilityPreferences);
document.querySelectorAll('input[name="themeMode"]').forEach((input) => input.addEventListener("change", saveAccessibilityPreferences));
document.querySelectorAll('input[name="colorTheme"]').forEach((input) => input.addEventListener("change", saveAccessibilityPreferences));
document.getElementById("languageChoice").addEventListener("change", saveAccessibilityPreferences);
document.getElementById("accessibilitySettingsModal").addEventListener("close", () => {
  const returnButton = currentRole
    ? document.getElementById("accessibilitySettingsButton")
    : document.getElementById("authAccessibilitySettingsButton");
  returnButton.focus();
});

document.getElementById("readerTourButton").addEventListener("click", openReaderTour);
document.getElementById("readerTourSkip").addEventListener("click", () => closeModal(document.getElementById("readerTourModal")));
document.getElementById("readerTourBack").addEventListener("click", () => updateReaderTourStep(readerTourStep - 1));
document.getElementById("readerTourNext").addEventListener("click", () => updateReaderTourStep(readerTourStep + 1));
document.getElementById("readerTourFinish").addEventListener("click", () => closeModal(document.getElementById("readerTourModal")));
document.getElementById("readerTourModal").addEventListener("close", () => {
  if (currentRole === "reader") document.getElementById("readerTourButton").focus();
});

document.getElementById("settingsTourButton").addEventListener("click", openSettingsTour);
document.querySelectorAll("[data-settings-tour-text-size]").forEach((button) => {
  button.addEventListener("click", () => updateSettingsTourTextPreview(button.dataset.settingsTourTextSize));
});
document.getElementById("settingsTourSkip").addEventListener("click", () => closeModal(document.getElementById("readingSettingsTourModal")));
document.getElementById("settingsTourBack").addEventListener("click", () => updateSettingsTourStep(settingsTourStep - 1));
document.getElementById("settingsTourNext").addEventListener("click", () => updateSettingsTourStep(settingsTourStep + 1));
document.getElementById("settingsTourFinish").addEventListener("click", () => closeModal(document.getElementById("readingSettingsTourModal")));
document.getElementById("readingSettingsTourModal").addEventListener("close", () => {
  document.getElementById("settingsTourButton").focus();
});

document.querySelectorAll("[data-auth-role]").forEach((button) => {
  button.addEventListener("click", () => updateLoginRole(button.dataset.authRole));
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  setPasswordToggleState(button, false);
  button.addEventListener("click", () => {
    const group = button.dataset.passwordToggle;
    const inputs = Array.from(document.querySelectorAll("[data-password-group]"))
      .filter((input) => input.dataset.passwordGroup === group);
    const isVisible = inputs.some((input) => input.type === "password");
    inputs.forEach((input) => {
      input.type = isVisible ? "text" : "password";
    });
    document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
      if (toggle.dataset.passwordToggle !== group) return;
      setPasswordToggleState(toggle, isVisible);
    });
  });
});
document.getElementById("adminPassword").addEventListener("input", () => {
  updatePasswordStrength("admin");
  updatePasswordMatch("admin");
  updateAccountSetupChecklist();
});
document.getElementById("confirmAdminPassword").addEventListener("input", () => {
  updatePasswordMatch("admin");
  updateAccountSetupChecklist();
});
document.getElementById("readerPassword").addEventListener("input", () => {
  updatePasswordStrength("reader");
  updatePasswordMatch("reader");
  updateAccountSetupChecklist();
});
document.getElementById("confirmReaderPassword").addEventListener("input", () => {
  updatePasswordMatch("reader");
  updateAccountSetupChecklist();
});
document.getElementById("recoveryPassword").addEventListener("input", () => {
  updatePasswordStrength("recovery");
  updatePasswordMatch("recovery");
});
document.getElementById("confirmRecoveryPassword").addEventListener("input", () => updatePasswordMatch("recovery"));

document.getElementById("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("authError");
  const isSetup = !document.getElementById("setupFields").hidden;
  error.textContent = "";
  try {
    let session;
    if (isSetup) {
      const adminPassword = document.getElementById("adminPassword").value;
      const readerPassword = document.getElementById("readerPassword").value;
      if (adminPassword.length < 6 || readerPassword.length < 6) {
        throw new Error("Use at least 6 characters for each password.");
      }
      if (adminPassword !== document.getElementById("confirmAdminPassword").value) {
        throw new Error("The Admin passwords do not match.");
      }
      if (readerPassword !== document.getElementById("confirmReaderPassword").value) {
        throw new Error("The Reader passwords do not match.");
      }
      session = await api("/api/setup", {
        method: "POST",
        body: { adminPassword, readerPassword, books: loadLegacyBooks() }
      });
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* The server now holds the library copy. */ }
    } else {
      session = await api("/api/login", {
        method: "POST",
        body: { role: selectedLoginRole, password: document.getElementById("loginPassword").value }
      });
      document.getElementById("loginPassword").value = "";
    }
    showLibrary(session);
  } catch (reason) {
    error.textContent = reason.message;
  }
});

document.getElementById("confirmRemove").addEventListener("click", async () => {
  if (currentRole !== "admin") return;
  const book = books.find((item) => item.id === selectedRemoveBookId);
  if (!book) return;
  try {
    await api(`/api/books/${encodeURIComponent(book.id)}`, { method: "DELETE" });
    books = books.filter((item) => item.id !== selectedRemoveBookId);
    selectedRemoveBookId = null;
    closeModal(document.getElementById("removeModal"));
    render();
    showToast(`${book.title} was removed from the shelf.`);
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("openAddBook").addEventListener("click", () => {
  if (currentRole !== "admin") return;
  selectedEditBookId = null;
  document.getElementById("bookForm").reset();
  resetCoverUpload();
  document.getElementById("bookFormError").textContent = "";
  document.getElementById("bookModalKicker").textContent = "A NEW ADVENTURE IS JOINING";
  document.getElementById("bookModalTitle").textContent = "Add a new story";
  document.getElementById("bookModalDescription").textContent = "Add the details and give this book a happy home.";
  document.getElementById("bookFormSubmitText").textContent = "Add to my bookshelf";
  document.getElementById("uploadText").innerHTML = "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
  openModal(document.getElementById("bookModal"));
  document.getElementById("bookTitle").focus();
});

document.getElementById("bookForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;
  const form = event.currentTarget;
  const file = document.getElementById("coverUpload").files[0];
  const error = document.getElementById("bookFormError");
  error.textContent = "";
  if (file && file.size > 8 * 1024 * 1024) {
    error.textContent = "That picture is too big. Please choose one under 8 MB.";
    return;
  }
  let coverImage = "";
  if (file) {
    try {
      coverImage = await resizeCover(file);
    } catch (reason) {
      error.textContent = reason.message;
      return;
    }
  }
  const formData = new FormData(form);
  const bookDetails = {
    title: String(formData.get("title")).trim(),
    author: String(formData.get("author")).trim(),
    category: String(formData.get("category"))
  };
  if (selectedEditBookId) {
    if (coverImage) bookDetails.coverImage = coverImage;
    try {
      const result = await api(`/api/books/${encodeURIComponent(selectedEditBookId)}`, { method: "PUT", body: bookDetails });
      const index = books.findIndex((book) => book.id === selectedEditBookId);
      if (index !== -1) books[index] = result.book;
    } catch (reason) {
      error.textContent = reason.message;
      return;
    }
    selectedEditBookId = null;
    form.reset();
    resetCoverUpload();
    closeModal(document.getElementById("bookModal"));
    render();
    showToast("Book details updated!");
    return;
  }
  const newBook = {
    id: makeId(),
    ...bookDetails,
    emoji: "📖",
    color: ["#e5ddff", "#d8efff", "#ffe8c6", "#dff2d5", "#f7dfd5"][Math.floor(Math.random() * 5)],
    coverImage,
    available: true
  };
  try {
    const result = await api("/api/books", { method: "POST", body: newBook });
    books.unshift(result.book);
  } catch (reason) {
    error.textContent = reason.message;
    return;
  }
  form.reset();
  resetCoverUpload();
  closeModal(document.getElementById("bookModal"));
  currentFilter = "all";
  searchInput.value = "";
  render();
  showToast("A new story found its way to your shelf!");
});

document.getElementById("coverUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    clearCoverPreview();
    coverPreviewObjectUrl = URL.createObjectURL(file);
    showCoverPreview(coverPreviewObjectUrl, `Preview of ${file.name}`);
    document.getElementById("uploadText").innerHTML = `<strong>${escapeHtml(file.name)}</strong><small>Picture preview ready</small>`;
    return;
  }

  const book = books.find((item) => item.id === selectedEditBookId);
  clearCoverPreview();
  if (book && book.coverImage) {
    showCoverPreview(book.coverImage, `Current cover for ${book.title}`);
    document.getElementById("uploadText").innerHTML = "<strong>Current cover is shown</strong><small>Choose a new picture to replace it</small>";
  } else {
    document.getElementById("uploadText").innerHTML = "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
  }
});

document.getElementById("borrowForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "reader") return;
  const student = document.getElementById("studentName").value.trim();
  const dueDate = document.getElementById("dueDate").value;
  const error = document.getElementById("borrowFormError");
  if (!student) {
    error.textContent = "Please add the student's name.";
    return;
  }
  const book = books.find((item) => item.id === selectedBookId);
  if (!book) return;
  try {
    const result = await api(`/api/books/${encodeURIComponent(book.id)}/borrow`, {
      method: "POST",
      body: { student, dueDate }
    });
    Object.assign(book, result.book);
  } catch (reason) {
    error.textContent = reason.message;
    return;
  }
  closeModal(document.getElementById("borrowModal"));
  render();
  showToast(`${book.title} has been lent to ${student}.`);
});

searchInput.addEventListener("input", render);
document.querySelector(".brand").addEventListener("click", (event) => {
  if (!currentRole || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  currentFilter = "all";
  searchInput.value = "";
  if (currentRole === "admin") setDueView("books");
  render();
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#home`);
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.getElementById("historyStudentFilter").addEventListener("input", renderHistoryList);
document.getElementById("historyBookFilter").addEventListener("input", renderHistoryList);
document.getElementById("historyFromDate").addEventListener("input", renderHistoryList);
document.getElementById("historyToDate").addEventListener("input", renderHistoryList);
document.getElementById("historyStatusFilter").addEventListener("change", renderHistoryList);
document.querySelectorAll("[data-history-status]").forEach((button) => {
  button.addEventListener("click", () => {
    const statusFilter = document.getElementById("historyStatusFilter");
    statusFilter.value = statusFilter.value === button.dataset.historyStatus ? "" : button.dataset.historyStatus;
    renderHistoryList();
  });
});
document.getElementById("clearHistoryFilters").addEventListener("click", () => {
  document.getElementById("historyStudentFilter").value = "";
  document.getElementById("historyBookFilter").value = "";
  document.getElementById("historyFromDate").value = "";
  document.getElementById("historyToDate").value = "";
  document.getElementById("historyStatusFilter").value = "";
  renderHistoryList();
});
document.getElementById("clearFilters").addEventListener("click", () => {
  currentFilter = "all";
  searchInput.value = "";
  render();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !document.querySelector(".modal[open]") && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelectorAll(".modal").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && dialog.id !== "authModal") closeModal(dialog);
  });
});
document.getElementById("bookModal").addEventListener("close", clearCoverPreview);

function updateTodayLabel() {
  document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat(currentLocale(), { weekday: "short", month: "long", day: "numeric" }).format(new Date());
}

updateTodayLabel();
applyAccessibilityPreferences();
initializeApp();
