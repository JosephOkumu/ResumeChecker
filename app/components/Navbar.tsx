import {Link} from "react-router";
import { useAuthStore } from "~/lib/auth";

const Navbar = () => {
    const { isAuthenticated, signOut } = useAuthStore();

    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">JobPass</p>
            </Link>
            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <>
                        <Link to="/upload" className="primary-button w-fit">
                            Upload Resume
                        </Link>
                        <button 
                            onClick={signOut}
                            className="secondary-button w-fit"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/auth" className="primary-button w-fit">
                        Get Started
                    </Link>
                )}
            </div>
        </nav>
    )
}
export default Navbar
