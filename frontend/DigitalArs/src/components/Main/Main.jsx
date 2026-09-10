import { Routes, Route } from 'react-router-dom'

import Home from '../../routes/Home'
import ProductDetailID from '../../routes/ProductId'

function Main() {
  return (
    <main>
      <Routes>
        <Route path='/' element={<Home />} />

        <Route path='/product/:id' element={<ProductDetailID />} />
      </Routes>
    </main>
  )
}

export default Main
