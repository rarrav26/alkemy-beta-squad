import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CardActionArea from '@mui/material/CardActionArea'
import CardActions from '@mui/material/CardActions'
import Paper from '@mui/material/Paper'
import { Link } from 'react-router-dom'
import ProductDetail from './ProductDetail'

function ProductCard({ product }) {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Paper
        sx={{
          width: '100%',
          display: 'flex',
          p: 1
        }}
      >
        <Card
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <CardActionArea
            onClick={handleOpen}
            sx={{
              flexGrow: 1
            }}
          >
            <CardMedia
              component='img'
              image={product.images[0]}
              alt={product.title}
              sx={{
                height: 220,
                objectFit: 'contain',
                p: 2
              }}
            />

            <CardContent>
              <Typography gutterBottom variant='h5'>
                {product.title}
              </Typography>

              <Typography variant='h6' color='primary'>
                ${product.price}
              </Typography>
            </CardContent>
          </CardActionArea>

          <CardActions>
            <Button
              size='small'
              component={Link}
              to={`/product/${product.id}`}
              sx={{
                boxShadow: 2,
                borderRadius: 1,
                px: 2,
                py: 0.7,

                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Show Detail
            </Button>
          </CardActions>
        </Card>
      </Paper>

      <ProductDetail product={product} open={open} handleClose={handleClose} />
    </>
  )
}

export default ProductCard
