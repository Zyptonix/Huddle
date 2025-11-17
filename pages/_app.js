import { AuthProvider } from '../context/AuthContext'
    import '../styles/globals.css' // This is for Tailwind CSS

    function MyApp({ Component, pageProps }) {
      return (
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      )
    }

    export default MyApp