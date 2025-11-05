export default function ContactPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <h1 className="text-lg font-semibold mb-3">Contact</h1>
      <div className="space-y-4">
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="font-medium">RJ Pickleball Club</div>
          <p className="text-sm text-gray-600 mt-1">123 Court Street, Your City, 12345</p>
          <p className="text-sm text-gray-600">Open daily: 6:00 AM – 10:00 PM</p>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="font-medium">Phone</div>
          <a className="text-blue-600 text-sm" href="tel:+11234567890">+1 123 456 7890</a>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="font-medium">Email</div>
          <a className="text-blue-600 text-sm" href="mailto:info@rjpickleball.com">info@rjpickleball.com</a>
        </div>
      </div>
    </div>
  );
}
