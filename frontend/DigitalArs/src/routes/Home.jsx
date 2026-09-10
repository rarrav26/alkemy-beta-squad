import Login from '../components/Home/Login'
import { ElementosGlobales } from '../context/ElementosGlobales'
import { useContext } from 'react'

function Home() {
  const { products, error, loading } = useContext(ElementosGlobales)

  return (
    <section>
      <Login />
    </section>
  )
}
export default Home
