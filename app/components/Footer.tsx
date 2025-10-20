const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-6 mt-16">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex justify-center items-center gap-8 text-gray-300">
                    <span className="hover:text-white transition-colors cursor-pointer">About Us</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Contact Us</span>
                </div>
                <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
                    <p>&copy; 2024 JobPass. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
