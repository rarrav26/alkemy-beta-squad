import ProductList from '../components/Home/ProductList'
import { ElementosGlobales } from '../context/ElementosGlobales'
import { useContext, useState } from 'react'

function Home() {
  const { products, error, loading } = useContext(ElementosGlobales)

  return (
    <section>
      <ProductList />
    </section>
  )
}
export default Home
