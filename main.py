import os
import random
import string
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

inbox_db = {}

# 🪄 THE MASSIVE 1000+ HUMAN NAME DATABASE (Indian & Global Mix)
NAMES = [
    "aarav", "aditya", "amit", "anjali", "arjun", "aryan", "ayush", "deepak", "divya", "gaurav",
    "harsh", "ishaan", "karan", "kavya", "kiran", "krishna", "manish", "meha", "neha", "nikhil",
    "nisha", "pooja", "pranav", "priya", "rahul", "raj", "riya", "rohan", "rohit", "sachin",
    "sameer", "sanjay", "sneha", "sumit", "sunil", "suraj", "swati", "tarun", "varun", "vikas",
    "vikram", "vishal", "yash", "zoya", "abhishek", "akash", "ankit", "ashish", "chetna", "darshan",
    "gautam", "hari", "isha", "jyoti", "kamal", "kunal", "lakshmi", "madhav", "manoj", "maya",
    "mohan", "mukesh", "naveen", "nitin", "pallavi", "pankaj", "piyush", "pradeep", "prakash", "pramod",
    "prashant", "praveen", "preeti", "radha", "raghav", "rajan", "rajesh", "rajiv", "rakesh", "ramesh",
    "ravi", "rekha", "rishabh", "ritu", "roshni", "sahil", "sandeep", "sangeeta", "sanjiv", "saurabh",
    "shankar", "shikha", "shilpa", "shivam", "shreya", "shruti", "shweta", "siddharth", "sonam", "sonia",
    "sourabh", "srinivas", "subhash", "sudhir", "sujata", "suresh", "sushil", "sushma", "swapnil", "sweta",
    "umesh", "upendra", "utkarsh", "vaibhav", "vandana", "vidya", "vijay", "vikash", "vinay", "vineet",
    "vinod", "vipul", "virendra", "vishnu", "vivek", "vihaan", "vivaan", "ananya", "diya", "advik",
    "kabir", "ansh", "dev", "rudra", "aadhya", "kiara", "james", "david", "chris", "sarah", "maria", 
    "kevin", "jason", "peter", "lucas", "simon", "frank", "harry", "julia", "alice", "steve",
    "john", "robert", "michael", "william", "richard", "joseph", "thomas", "charles", "christopher",
    "daniel", "matthew", "anthony", "mark", "donald", "paul", "andrew", "joshua", "kenneth", "kevin",
    "brian", "george", "edward", "ronald", "timothy", "jason", "jeffrey", "ryan", "jacob", "gary",
    "nicholas", "eric", "jonathan", "stephen", "larry", "justin", "scott", "brandon", "benjamin",
    "samuel", "gregory", "frank", "alexander", "raymond", "patrick", "jack", "dennis", "jerry", "tyler",
    "aaron", "jose", "adam", "henry", "nathan", "douglas", "zachary", "peter", "kyle", "walter",
    "ethan", "jeremy", "christian", "keith", "roger", "terry", "gerald", "harold", "sean", "austin",
    "carl", "arthur", "lawrence", "dylan", "jesse", "jordan", "bryan", "ralph", "roy", "louis",
    "eugene", "wayne", "alan", "juan", "noah", "russell", "harry", "logan", "louis", "philip",
    "mary", "patricia", "jennifer", "linda", "elizabeth", "barbara", "susan", "jessica", "karen",
    "nancy", "lisa", "betty", "margaret", "sandra", "ashley", "kimberly", "emily", "donna", "michelle",
    "dorothy", "carol", "amanda", "melissa", "deborah", "stephanie", "rebecca", "sharon", "laura",
    "cynthia", "kathleen", "amy", "shirley", "angela", "helen", "anna", "brenda", "pamela", "nicole",
    "emma", "samantha", "katherine", "christine", "debra", "rachel", "catherine", "carolyn", "janet",
    "ruth", "maria", "heather", "diane", "virginia", "julie", "joyce", "victoria", "olivia", "kelly",
    "christina", "lauren", "joan", "evelyn", "judith", "megan", "andrea", "cheryl", "hannah", "jacqueline",
    "martha", "gloria", "mildred", "teresa", "sara", "janice", "julia", "marie", "madison", "grace",
    "judy", "abigail", "beverly", "denise", "marilyn", "amber", "danielle", "rose", "brittany", "diana",
    "abdul", "akbar", "ali", "amir", "arif", "asim", "bilal", "danish", "fahad", "faizan", "farhan",
    "furqan", "hamza", "hassan", "husain", "ibrahim", "imran", "irfan", "javed", "junaid", "kamran",
    "kashif", "khalid", "mahmood", "majid", "mansoor", "mohsin", "mubashir", "mudassir", "nadeem",
    "nasir", "nauman", "nawaz", "noman", "obaid", "omar", "osama", "raza", "rizwan", "saad", "saeed",
    "salman", "samir", "shafeeq", "shahid", "shahzaib", "shakeel", "shoaib", "sohail", "syed", "tahir",
    "tariq", "taufeeq", "umer", "usman", "waqar", "waseem", "yasir", "younus", "zafar", "zahid", "zain",
    "zeeshan", "zubair", "aamna", "afshan", "amira", "anam", "aqsa", "asma", "ayesha", "bushra", "eram",
    "farah", "fariha", "fatima", "fouzia", "ghazala", "hadiya", "hafsa", "hina", "hira", "humaira", "iqra",
    "khadija", "kinza", "kiran", "komal", "lubna", "madiha", "maha", "maheen", "maira", "maliha", "maria",
    "maryam", "mehwish", "misbah", "mona", "nadia", "nida", "nimra", "nosheen", "rabia", "rida", "rimsha",
    "rubina", "ruksana", "saba", "sadia", "sahar", "saima", "saira", "salma", "samina", "samra", "sana",
    "sania", "sara", "shabana", "shafaq", "shazia", "shumaila", "sobiy", "sumaira", "tahira", "tanzila",
    "uzma", "warda", "zara", "zoya", "aarohi", "aditi", "aishwarya", "akansha", "alia", "amrita", "ananya",
    "anika", "anushka", "arpita", "avni", "bhumika", "chahat", "charu", "deepali", "diksha", "disha",
    "ektra", "esha", "garima", "geeta", "gunjan", "himanshi", "ishita", "jahnvi", "kajal", "kalyani",
    "kamini", "kanika", "karishma", "kavita", "khushi", "kriti", "kritika", "latika", "madhu", "mahi",
    "malvika", "manisha", "mansi", "meenakshi", "meghna", "mitali", "monika", "mrunal", "namrata",
    "nandini", "navya", "neelam", "nidhi", "nikita", "nupur", "nutan", "ojaswi", "pallavi", "pari",
    "parul", "payal", "poonam", "prachi", "pragya", "prerana", "priyanka", "rachna", "radhika", "rajni",
    "rakhi", "rashmi", "raveena", "richa", "riddhi", "ritika", "riya", "roop", "ruchika", "rupali",
    "sakshi", "saloni", "samiksha", "sanjana", "sanjoli", "sapna", "sarita", "saumya", "savita", "seema",
    "shagun", "shalini", "sheetal", "shikha", "shilpa", "shivangi", "shivani", "shraddha", "shreya",
    "shubhangi", "simran", "smriti", "snigdha", "sonal", "sonali", "srishti", "stuti", "suhani", "suman",
    "sunita", "supriya", "surbhi", "sushma", "swara", "tanisha", "tanvi", "tanya", "tejaswini", "trisha",
    "tulsi", "upasana", "urmila", "urvashi", "vaishnavi", "vandana", "vanshika", "vidhi", "vidya",
    "vishakha", "vrinda", "yamini", "yashika", "yashvi", "aakash", "aanand", "abhay", "abhijeet",
    "abhinav", "adarsh", "akhil", "akshay", "alok", "aman", "amarnath", "ambrish", "amitabh", "amrit",
    "anand", "anil", "anirudh", "anmol", "anoop", "anurag", "arvind", "ashok", "ashwin", "atul", "avinash",
    "badrinath", "balram", "bhagat", "bharat", "bhaskar", "bhavin", "bhupendra", "brijesh", "chaitanya",
    "chandan", "chandra", "charan", "chetan", "chirag", "darshan", "dayanand", "deep", "devendra",
    "dhananjay", "dharmendra", "dhruv", "dilip", "dinesh", "dipak", "diwakar", "durgesh", "gajendra",
    "ganesh", "girish", "gokul", "gopal", "govind", "gulshan", "guru", "gyan", "hardik", "hariom",
    "harish", "harshvardhan", "hemant", "hitendra", "hrithik", "inder", "jagdish", "jai", "jayant",
    "jayesh", "jeevan", "jitendra", "kailash", "kalyan", "kamlesh", "kanhaiya", "kapil", "kartik",
    "kaushal", "kavindra", "kedar", "keshav", "kishore", "kripa", "kunal", "lakshman", "lalit", "lokesh",
    "madan", "madhav", "mahendra", "mahesh", "makrand", "manik", "manish", "manohar", "mayank", "milind",
    "mitesh", "mithilesh", "mohit", "mukund", "murali", "nabin", "nachiket", "nagarjuna", "nagendra",
    "naman", "narayan", "narendra", "naresh", "navneet", "neeraj", "nihar", "nikhil", "nilay", "nilesh",
    "niraj", "niranjan", "nishant", "nitish", "omkar", "pankaj", "param", "paras", "paresh", "parth",
    "pavan", "piyush", "prabhakar", "prabhu", "pradeep", "pradyumna", "praful", "prakash", "pramod",
    "pranav", "pranay", "prasad", "prashant", "pratap", "prateek", "pravin", "prem", "pritam", "prithviraj",
    "pulkit", "puneet", "pushkar", "raghavendra", "rahul", "rajan", "rajat", "rajeev", "rajendra",
    "rajesh", "rajnish", "raju", "rakesh", "ram", "ramakant", "ramesh", "ramnath", "ranbir", "randhir",
    "ranjit", "ratnesh", "ravi", "ravindra", "rishabh", "ritesh", "rohan", "rohit", "roshan", "rupak",
    "rupesh", "sachin", "sagar", "sahil", "samar", "sameer", "sampat", "sandeep", "sanjay", "sanjeev",
    "sanket", "santosh", "sarvesh", "satish", "satyendra", "saurabh", "shailendra", "shailesh", "shankar",
    "sharad", "shashank", "shashi", "shatrughan", "shikhar", "shirish", "shiv", "shivanand", "shreyas",
    "shrikant", "shyam", "siddharth", "sohan", "somesh", "sourabh", "sridhar", "srikanth", "srinivas",
    "subhash", "subodh", "sudhakar", "sudhanshu", "sudhir", "sujit", "sukumar", "suman", "sumeet",
    "sumit", "sunder", "sunil", "suraj", "surendra", "suresh", "surya", "sushant", "sushil", "swapnil",
    "tapan", "tarun", "tejas", "trilok", "tushar", "uday", "uddhav", "udit", "ujwal", "umakant", "umesh",
    "upendra", "utkarsh", "uttam", "vaibhav", "varun", "vasant", "vasudev", "ved", "vidyut", "vijay",
    "vikas", "vikram", "vimal", "vinay", "vineet", "vinod", "vipin", "vipul", "virendra", "vishal",
    "vishnu", "vishwanath", "vivek", "yadav", "yash", "yashwant", "yatin", "yogendra", "yogesh"
]

@app.get("/")
@app.head("/")
async def home():
    """Serves the Premium Home Page"""
    return FileResponse("static/index.html")

@app.get("/mailbox")
async def view_mailbox():
    """Serves the secure, cloaked Inbox Page"""
    return FileResponse("static/inbox.html")

@app.get("/message")
async def view_message():
    """Serves the secure, cloaked Reader Page"""
    return FileResponse("static/read.html")

@app.get("/api/generate")
async def generate_email():
    """Generates a realistic BlinkMail address 💀"""
    name = random.choice(NAMES)
    numbers = ''.join(random.choice(string.digits) for _ in range(3))
    email = f"{name}{numbers}@blinkmail.techbittu.co.uk"
    return {"email": email}

@app.get("/api/messages/{email}")
async def get_messages(email: str):
    return inbox_db.get(email, [])

class IncomingEmail(BaseModel):
    to: str
    sender: str
    subject: str
    text: str

@app.post("/api/webhook")
async def receive_email(email: IncomingEmail):
    """Cloudflare posts intercepted emails here"""
    recipient = email.to.lower()
    if recipient not in inbox_db:
        inbox_db[recipient] = []
        
    inbox_db[recipient].append({
        "sender": email.sender,
        "subject": email.subject,
        "text": email.text
    })
    return {"status": "success"}

@app.get("/ping")
@app.head("/ping")
async def ping():
    return {"status": "BlinkMail is alive 💀"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
