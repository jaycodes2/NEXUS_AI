import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const [status, setStatus] = useState("");

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setStatus("Sending...");
    
    const res = await fetch(`${API_URL}/contact/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (data.success) {
      setStatus("Message sent!");
      setForm({ name: "", email: "", company: "", message: "" });
    } else {
      setStatus("Failed to send message");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 flex justify-center items-center">
      <div className="w-full flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 lg:p-10 border border-gray-800 space-y-8 w-full max-w-lg shadow-2xl"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Send us a message</h2>
            <p className="text-gray-400 text-sm">We'll get back to you soon</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Full name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-800/50 border border-gray-700 p-4 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Email Address *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-800/50 border border-gray-700 p-4 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Company</label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 p-4 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                placeholder="Where do you work?"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Message *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                className="w-full bg-gray-800/50 border border-gray-700 p-4 rounded-xl h-32 resize-none outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                placeholder="Tell us how we can help you..."
              ></textarea>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Send Message
          </button>

          {status && (
            <p className={`text-center text-sm font-medium ${
              status.includes("Failed") ? "text-red-400" : "text-green-400"
            }`}>
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}