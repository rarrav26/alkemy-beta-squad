import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { ElementosGlobales } from '../context/ElementosGlobales'
import { useContext } from 'react'

function ProductDetailID() {
  const { darkMode } = useContext(ElementosGlobales)

  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function getProduct() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`https://dummyjson.com/products/${id}`)

      if (!response.ok) {
        throw new Error('No se pudo obtener el producto')
      }

      const data = await response.json()

      setProduct(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getProduct()
  }, [id])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <LinearProgress sx={{ width: '70%' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Typography
        color='error'
        sx={{
          textAlign: 'center',
          mt: 4
        }}
      >
        {error}
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          md: 4
        }
      }}
    >
      <Button
        component={Link}
        to='/'
        startIcon={<ArrowBackIcon />}
        sx={{
          backgroundColor: darkMode ? '#1E1E1E' : '#FFFFFF',
          mb: 3,
          boxShadow: 2,
          borderRadius: 1,
          px: 2,
          py: 0.7,

          '&:hover': {
            boxShadow: 4
          }
        }}
      >
        Home
      </Button>

      <Paper
        sx={{
          p: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            gap: 4
          }}
        >
          <Box
            component='img'
            src={product.images[0]}
            alt={product.title}
            sx={{
              width: {
                xs: '100%',
                md: '45%'
              },
              height: 400,
              objectFit: 'contain'
            }}
          />

          <Box
            sx={{
              flexGrow: 1
            }}
          >
            <Typography variant='h3' component='h1' gutterBottom>
              {product.title}
            </Typography>

            <Chip label={product.category} sx={{ mb: 2 }} />

            <Typography variant='h4' color='primary' gutterBottom>
              ${product.price}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}
            >
              <Rating value={product.rating} precision={0.1} readOnly />

              <Typography>{product.rating}</Typography>
            </Box>

            <Typography
              variant='body1'
              sx={{
                mb: 3
              }}
            >
              {product.description}
            </Typography>

            <Typography variant='h6' gutterBottom>
              Stock: {product.stock}
            </Typography>

            <Typography
              color={product.stock > 0 ? 'success.main' : 'error.main'}
            >
              {product.availabilityStatus}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant='h4' gutterBottom>
          Opinions
        </Typography>

        {product.reviews.map((review, index) => (
          <Paper
            key={index}
            variant='outlined'
            sx={{
              p: 2,
              mb: 2
            }}
          >
            <Typography variant='h6' gutterBottom>
              {review.reviewerName}
            </Typography>

            <Rating value={review.rating} readOnly size='small' />

            <Typography
              sx={{
                mt: 1
              }}
            >
              {review.comment}
            </Typography>
          </Paper>
        ))}
      </Paper>
    </Box>
  )
}

export default ProductDetailID
